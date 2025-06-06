-- Migration: Scanner Integration - PostgreSQL Syntax Corrected
-- Integrates scanner functionality with existing UUID-based schema
-- Date: 2025-06-06 (Fixed PostgreSQL constraint syntax)

-- Step 1: Add scanner fields to existing price_reports table
ALTER TABLE price_reports 
ADD COLUMN IF NOT EXISTS scanner_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS original_product_name TEXT,
ADD COLUMN IF NOT EXISTS scanner_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scanner_grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS detected_brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS scanner_product_id UUID,
ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMP WITH TIME ZONE;

-- Step 2: Create dedicated scanner products table (UUID compatible)
CREATE TABLE IF NOT EXISTS scanner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product identification
  product_name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  brand VARCHAR(100),
  
  -- Pricing information
  price DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT '₪',
  
  -- Product details
  category VARCHAR(100),
  weight VARCHAR(50),
  unit VARCHAR(20),
  
  -- Store information
  store_name VARCHAR(100) NOT NULL,
  store_site VARCHAR(100),
  retailer_id UUID,
  
  -- Scanner metadata
  scanner_confidence DECIMAL(3,2),
  scanner_source VARCHAR(50) DEFAULT 'browser-use-ai',
  scan_timestamp TIMESTAMP WITH TIME ZONE,
  site_confidence DECIMAL(3,2),
  
  -- Link to existing schema
  meat_cut_id UUID,
  
  -- System metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Quality indicators
  is_valid BOOLEAN DEFAULT TRUE,
  validation_notes TEXT,
  
  -- Deduplication
  product_hash VARCHAR(64),
  
  CONSTRAINT valid_confidence CHECK (scanner_confidence >= 0 AND scanner_confidence <= 1),
  CONSTRAINT valid_site_confidence CHECK (site_confidence >= 0 AND site_confidence <= 1),
  CONSTRAINT valid_price CHECK (price > 0),
  CONSTRAINT scanner_products_retailer_id_fkey FOREIGN KEY (retailer_id) REFERENCES retailers(id),
  CONSTRAINT scanner_products_meat_cut_id_fkey FOREIGN KEY (meat_cut_id) REFERENCES meat_cuts(id)
);

-- Step 3: Create scanner activity tracking table (UUID compatible)
CREATE TABLE IF NOT EXISTS scanner_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_site VARCHAR(100) NOT NULL,
  products_found INTEGER DEFAULT 0,
  products_processed INTEGER DEFAULT 0,
  products_valid INTEGER DEFAULT 0,
  average_confidence DECIMAL(3,2),
  scan_duration_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create scanner ingestion logs (UUID compatible)
CREATE TABLE IF NOT EXISTS scanner_ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_site VARCHAR(50) NOT NULL,
  total_products INTEGER NOT NULL,
  processed_products INTEGER NOT NULL,
  duplicates_removed INTEGER DEFAULT 0,
  average_confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create scanner quality metrics (UUID compatible)
CREATE TABLE IF NOT EXISTS scanner_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date DATE NOT NULL,
  site_name VARCHAR(50) NOT NULL,
  total_products INTEGER NOT NULL,
  high_confidence_products INTEGER DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  products_with_brand INTEGER DEFAULT 0,
  grade_distribution JSONB DEFAULT '{}',
  price_accuracy_score DECIMAL(3,2),
  processing_time_avg INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scan_date, site_name)
);

-- Step 6: Add foreign key reference from price_reports to scanner_products
-- FIXED: Use DO block to check if constraint exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'price_reports' 
    AND constraint_name = 'price_reports_scanner_product_id_fkey'
  ) THEN
    ALTER TABLE price_reports 
    ADD CONSTRAINT price_reports_scanner_product_id_fkey 
    FOREIGN KEY (scanner_product_id) REFERENCES scanner_products(id);
  END IF;
END $$;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_scanner_products_store_site ON scanner_products(store_site, scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_scanner_products_category ON scanner_products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_scanner_products_confidence ON scanner_products(scanner_confidence, is_valid);
CREATE INDEX IF NOT EXISTS idx_scanner_products_price ON scanner_products(price, price_per_kg);
CREATE INDEX IF NOT EXISTS idx_scanner_products_name_search ON scanner_products USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_scanner_products_name_simple ON scanner_products(product_name);
CREATE INDEX IF NOT EXISTS idx_scanner_products_hash ON scanner_products(product_hash);
CREATE INDEX IF NOT EXISTS idx_scanner_products_retailer ON scanner_products(retailer_id);
CREATE INDEX IF NOT EXISTS idx_scanner_products_meat_cut ON scanner_products(meat_cut_id);

CREATE INDEX IF NOT EXISTS idx_scanner_activity_site_timestamp ON scanner_activity(target_site, scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_timestamp ON scanner_ingestion_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_site ON scanner_ingestion_logs(target_site);
CREATE INDEX IF NOT EXISTS idx_scanner_metrics_date_site ON scanner_quality_metrics(scan_date, site_name);

-- Scanner-related indexes on price_reports
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_source ON price_reports(scanner_source);
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_confidence ON price_reports(scanner_confidence);
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_product ON price_reports(scanner_product_id);

-- Step 8: Create views for scanner integration
CREATE OR REPLACE VIEW latest_scanner_products AS
SELECT DISTINCT ON (store_site, normalized_name)
  *
FROM scanner_products 
WHERE is_active = TRUE AND is_valid = TRUE
ORDER BY store_site, normalized_name, scan_timestamp DESC;

CREATE OR REPLACE VIEW scanner_dashboard_stats AS
SELECT 
  target_site,
  COUNT(*) as total_scans,
  AVG(products_processed) as avg_products_per_scan,
  AVG(average_confidence) as avg_confidence,
  MAX(scan_timestamp) as last_scan,
  SUM(products_processed) as total_products_collected,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_scans,
  COUNT(CASE WHEN scan_timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as scans_today
FROM scanner_activity 
GROUP BY target_site
ORDER BY last_scan DESC;

CREATE OR REPLACE VIEW product_price_comparison AS
SELECT 
  sp.normalized_name,
  sp.category,
  mc.name_hebrew as meat_cut_name,
  r.name as retailer_name,
  COUNT(DISTINCT sp.store_site) as available_stores,
  MIN(sp.price_per_kg) as lowest_price,
  MAX(sp.price_per_kg) as highest_price,
  AVG(sp.price_per_kg) as average_price,
  ROUND(((MAX(sp.price_per_kg) - MIN(sp.price_per_kg)) / MIN(sp.price_per_kg) * 100), 2) as price_variance_percent,
  AVG(sp.scanner_confidence) as avg_confidence,
  MAX(sp.scan_timestamp) as last_updated
FROM scanner_products sp
LEFT JOIN meat_cuts mc ON sp.meat_cut_id = mc.id
LEFT JOIN retailers r ON sp.retailer_id = r.id
WHERE sp.is_active = TRUE AND sp.is_valid = TRUE
GROUP BY sp.normalized_name, sp.category, mc.name_hebrew, r.name
HAVING COUNT(*) > 1
ORDER BY price_variance_percent DESC;

-- Integrated view combining scanner and manual data
CREATE OR REPLACE VIEW integrated_price_view AS
SELECT 
  'manual' as data_source,
  pr.id,
  mc.name_hebrew as product_name,
  r.name as store_name,
  r.id as retailer_id,
  mc.id as meat_cut_id,
  pr.price_per_kg::DECIMAL / 100 as price_per_kg,
  pr.confidence_score::DECIMAL / 5 as confidence,
  pr.created_at,
  pr.is_active,
  NULL as scanner_source
FROM price_reports pr
JOIN meat_cuts mc ON pr.meat_cut_id = mc.id
JOIN retailers r ON pr.retailer_id = r.id
WHERE pr.is_active = TRUE

UNION ALL

SELECT 
  'scanner' as data_source,
  sp.id,
  sp.product_name,
  sp.store_name,
  sp.retailer_id,
  sp.meat_cut_id,
  sp.price_per_kg,
  sp.scanner_confidence,
  sp.created_at,
  sp.is_active,
  sp.scanner_source
FROM scanner_products sp
WHERE sp.is_active = TRUE AND sp.is_valid = TRUE;

-- Step 9: Set up Row Level Security
ALTER TABLE scanner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access policies
DROP POLICY IF EXISTS "Public read access on scanner_products" ON scanner_products;
CREATE POLICY "Public read access on scanner_products" 
ON scanner_products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read access on scanner_activity" ON scanner_activity;
CREATE POLICY "Public read access on scanner_activity" 
ON scanner_activity FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public read access on scanner_ingestion_logs" ON scanner_ingestion_logs;
CREATE POLICY "Public read access on scanner_ingestion_logs" 
ON scanner_ingestion_logs FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Public read access on scanner_quality_metrics" ON scanner_quality_metrics;
CREATE POLICY "Public read access on scanner_quality_metrics" 
ON scanner_quality_metrics FOR SELECT 
TO authenticated 
USING (true);

-- API insert access policies
DROP POLICY IF EXISTS "API insert access on scanner_products" ON scanner_products;
CREATE POLICY "API insert access on scanner_products" 
ON scanner_products FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "API insert access on scanner_activity" ON scanner_activity;
CREATE POLICY "API insert access on scanner_activity" 
ON scanner_activity FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Scanner system can insert logs" ON scanner_ingestion_logs;
CREATE POLICY "Scanner system can insert logs"
ON scanner_ingestion_logs FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Scanner system can insert/update metrics" ON scanner_quality_metrics;
CREATE POLICY "Scanner system can insert/update metrics"
ON scanner_quality_metrics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 10: Create integration functions
CREATE OR REPLACE FUNCTION match_scanner_to_existing_data(
  scanner_product_name TEXT,
  store_name TEXT
)
RETURNS TABLE (
  meat_cut_id UUID,
  retailer_id UUID,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id as meat_cut_id,
    r.id as retailer_id,
    CASE 
      WHEN LOWER(scanner_product_name) LIKE '%' || LOWER(mc.name_hebrew) || '%' THEN 0.9
      WHEN LOWER(scanner_product_name) LIKE '%' || LOWER(mc.name_english) || '%' THEN 0.8
      ELSE 0.5
    END as confidence_score
  FROM meat_cuts mc
  CROSS JOIN retailers r
  WHERE r.name ILIKE '%' || store_name || '%'
    AND mc.is_active = TRUE
    AND r.is_active = TRUE
  ORDER BY confidence_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-link scanner products to existing schema
CREATE OR REPLACE FUNCTION link_scanner_product()
RETURNS TRIGGER AS $$
DECLARE
  matched_data RECORD;
BEGIN
  -- Try to match scanner product to existing meat cuts and retailers
  SELECT * INTO matched_data
  FROM match_scanner_to_existing_data(NEW.product_name, NEW.store_name);
  
  IF matched_data IS NOT NULL THEN
    NEW.meat_cut_id := matched_data.meat_cut_id;
    NEW.retailer_id := matched_data.retailer_id;
    
    -- Also create a corresponding price_report entry
    INSERT INTO price_reports (
      meat_cut_id,
      retailer_id,
      price_per_kg,
      scanner_source,
      original_product_name,
      scanner_confidence,
      scanner_product_id,
      scan_timestamp,
      reported_by,
      confidence_score
    ) VALUES (
      NEW.meat_cut_id,
      NEW.retailer_id,
      (NEW.price_per_kg * 100)::INTEGER,
      NEW.scanner_source,
      NEW.product_name,
      NEW.scanner_confidence,
      NEW.id,
      NEW.scan_timestamp,
      'scanner-system'::TEXT,
      LEAST(5, GREATEST(1, (NEW.scanner_confidence * 5)::INTEGER))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-linking
DROP TRIGGER IF EXISTS auto_link_scanner_product ON scanner_products;
CREATE TRIGGER auto_link_scanner_product
  BEFORE INSERT ON scanner_products
  FOR EACH ROW
  EXECUTE FUNCTION link_scanner_product();

-- Function for dashboard data
CREATE OR REPLACE FUNCTION get_scanner_dashboard_data()
RETURNS TABLE (
  site_name TEXT,
  products_today INTEGER,
  avg_confidence NUMERIC,
  last_update TIMESTAMP WITH TIME ZONE,
  products_last_hour INTEGER,
  quality_rating TEXT,
  trend_7d NUMERIC,
  total_unique_products INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sds.target_site::TEXT,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM scanner_products sp 
       WHERE sp.store_site = sds.target_site 
         AND DATE(sp.scan_timestamp) = CURRENT_DATE), 
      0
    ),
    ROUND(sds.avg_confidence, 3),
    sds.last_scan,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM scanner_products sp 
       WHERE sp.store_site = sds.target_site 
         AND sp.scan_timestamp > NOW() - INTERVAL '1 hour'), 
      0
    ),
    CASE 
      WHEN sds.avg_confidence >= 0.85 THEN 'Excellent'
      WHEN sds.avg_confidence >= 0.7 THEN 'Good'
      WHEN sds.avg_confidence >= 0.5 THEN 'Fair'
      ELSE 'Poor'
    END::TEXT,
    ROUND(sds.avg_products_per_scan, 1),
    COALESCE(
      (SELECT COUNT(DISTINCT normalized_name)::INTEGER 
       FROM scanner_products sp 
       WHERE sp.store_site = sds.target_site 
         AND sp.is_active = TRUE), 
      0
    )
  FROM scanner_dashboard_stats sds
  ORDER BY sds.last_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant permissions
GRANT SELECT ON scanner_products TO authenticated;
GRANT SELECT ON scanner_activity TO authenticated;
GRANT SELECT ON scanner_ingestion_logs TO authenticated;
GRANT SELECT ON scanner_quality_metrics TO authenticated;
GRANT SELECT ON latest_scanner_products TO authenticated;
GRANT SELECT ON scanner_dashboard_stats TO authenticated;
GRANT SELECT ON product_price_comparison TO authenticated;
GRANT SELECT ON integrated_price_view TO authenticated;

GRANT EXECUTE ON FUNCTION get_scanner_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION match_scanner_to_existing_data(TEXT, TEXT) TO authenticated;

-- Step 12: Add helpful comments
COMMENT ON TABLE scanner_products IS 'Scanner-collected product data integrated with existing schema';
COMMENT ON TABLE scanner_activity IS 'Scanner operation tracking and performance metrics';
COMMENT ON TABLE scanner_ingestion_logs IS 'Detailed logs of scanner data ingestion';
COMMENT ON TABLE scanner_quality_metrics IS 'Daily quality metrics for scanner operations';
COMMENT ON VIEW integrated_price_view IS 'Unified view combining manual and scanner price data';
COMMENT ON FUNCTION link_scanner_product() IS 'Auto-links scanner products to existing meat cuts and retailers';

-- Step 13: Insert initial test data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scanner_ingestion_logs') THEN
    INSERT INTO scanner_ingestion_logs (target_site, total_products, processed_products, status, metadata)
    SELECT 'rami-levy', 45, 40, 'success', '{"test_mode": true, "categories": ["בקר", "עוף"]}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM scanner_ingestion_logs WHERE target_site = 'rami-levy');
    
    INSERT INTO scanner_ingestion_logs (target_site, total_products, processed_products, status, metadata)
    SELECT 'shufersal', 32, 28, 'success', '{"test_mode": true, "categories": ["דגים", "אחר"]}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM scanner_ingestion_logs WHERE target_site = 'shufersal');
  END IF;
END $$;
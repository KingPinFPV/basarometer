-- ENHANCED DATABASE SCHEMA FOR BASAROMETER V5.2+ (FIXED VERSION)
-- Building on existing successful patterns with real Israeli market data
-- Compatible with current production schema structure

-- Enhanced meat_cuts table with real market taxonomy
ALTER TABLE meat_cuts ADD COLUMN IF NOT EXISTS normalized_cut_id VARCHAR(100);
ALTER TABLE meat_cuts ADD COLUMN IF NOT EXISTS market_variations JSONB DEFAULT '[]';
ALTER TABLE meat_cuts ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(50);
ALTER TABLE meat_cuts ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT false;

-- Add unique constraint to meat_cuts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meat_cuts_name_hebrew_unique'
    ) THEN
        ALTER TABLE meat_cuts ADD CONSTRAINT meat_cuts_name_hebrew_unique UNIQUE (name_hebrew);
    END IF;
END $$;

-- New intelligent mapping table for auto-detection
CREATE TABLE IF NOT EXISTS meat_name_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meat_cut_id UUID REFERENCES meat_cuts(id),
  original_name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  quality_grade VARCHAR(50),
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  source VARCHAR(50) DEFAULT 'manual',
  auto_learned BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-expansion system for discovering new cuts
CREATE TABLE IF NOT EXISTS meat_discovery_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL UNIQUE,
  normalized_suggestion TEXT,
  quality_grade_suggestion VARCHAR(50),
  confidence_score DECIMAL(3,2),
  source_site VARCHAR(100),
  auto_classification JSONB,
  manual_review_needed BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced retailers table with chain information
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS chain_type VARCHAR(50);
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS market_segment VARCHAR(50);
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS branch_count INTEGER;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(20);

-- Performance indexes for enhanced functionality
CREATE INDEX IF NOT EXISTS idx_meat_name_mappings_normalized ON meat_name_mappings(normalized_name);
CREATE INDEX IF NOT EXISTS idx_meat_name_mappings_grade ON meat_name_mappings(quality_grade, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_meat_discovery_review ON meat_discovery_queue(manual_review_needed, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_meat_cuts_normalized ON meat_cuts(normalized_cut_id, quality_grade);

-- Simplified meat classification function
CREATE OR REPLACE FUNCTION classify_meat_product(product_name TEXT)
RETURNS TABLE (
  normalized_name TEXT,
  quality_grade TEXT,
  confidence DECIMAL(3,2),
  details JSONB
) AS $$
BEGIN
  -- Simple pattern matching for Hebrew meat names
  -- This is a basic implementation - can be enhanced with ML later
  
  -- Default values
  normalized_name := 'לא מזוהה';
  quality_grade := 'regular';
  confidence := 0.5;
  details := '{"method": "basic_pattern_matching"}';
  
  -- Check for common meat cuts
  IF product_name ILIKE '%אנטריקוט%' THEN
    normalized_name := 'אנטריקוט בקר';
    confidence := 0.9;
  ELSIF product_name ILIKE '%פילה%' THEN
    normalized_name := 'פילה בקר';
    confidence := 0.9;
  ELSIF product_name ILIKE '%סינטה%' THEN
    normalized_name := 'סינטה בקר';
    confidence := 0.9;
  ELSIF product_name ILIKE '%טחון%' THEN
    normalized_name := 'טחון בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%בריסקט%' OR product_name ILIKE '%חזה%' THEN
    normalized_name := 'בריסקט בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%אסאדו%' OR product_name ILIKE '%שפונדרה%' THEN
    normalized_name := 'אסאדו בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%כתף%' THEN
    normalized_name := 'כתף 5 בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%שריר%' THEN
    normalized_name := 'שריר מס 8 בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%שייטל%' THEN
    normalized_name := 'שייטל בקר';
    confidence := 0.8;
  ELSIF product_name ILIKE '%פיקניה%' THEN
    normalized_name := 'פיקניה בקר';
    confidence := 0.8;
  END IF;
  
  -- Check for quality grades
  IF product_name ILIKE '%אנגוס%' THEN
    quality_grade := 'angus';
    confidence := confidence + 0.1;
  ELSIF product_name ILIKE '%וואגיו%' OR product_name ILIKE '%wagyu%' THEN
    quality_grade := 'wagyu';
    confidence := confidence + 0.1;
  ELSIF product_name ILIKE '%עגל%' THEN
    quality_grade := 'veal';
    confidence := confidence + 0.05;
  ELSIF product_name ILIKE '%פרמיום%' OR product_name ILIKE '%מיושן%' THEN
    quality_grade := 'premium';
    confidence := confidence + 0.05;
  END IF;
  
  -- Cap confidence at 1.0
  confidence := LEAST(confidence, 1.0);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Auto-discovery trigger function
CREATE OR REPLACE FUNCTION auto_discover_meat_cuts()
RETURNS TRIGGER AS $$
DECLARE
  classification_result RECORD;
BEGIN
  -- Only process if product_name exists and contains Hebrew text
  IF NEW.product_name IS NOT NULL AND LENGTH(NEW.product_name) > 0 THEN
    
    -- Get classification for the product
    SELECT * INTO classification_result 
    FROM classify_meat_product(NEW.product_name) LIMIT 1;
    
    IF classification_result.confidence >= 0.8 THEN
      -- High confidence - auto-approve
      INSERT INTO meat_name_mappings (
        original_name, 
        normalized_name, 
        quality_grade,
        confidence_score,
        source,
        auto_learned
      ) VALUES (
        NEW.product_name,
        classification_result.normalized_name,
        classification_result.quality_grade,
        classification_result.confidence,
        'scanner',
        true
      ) ON CONFLICT (original_name) DO UPDATE SET
        usage_count = meat_name_mappings.usage_count + 1,
        last_seen = NOW();
        
    ELSIF classification_result.confidence >= 0.6 THEN
      -- Medium confidence - queue for review
      INSERT INTO meat_discovery_queue (
        product_name,
        normalized_suggestion,
        quality_grade_suggestion,
        confidence_score,
        source_site,
        auto_classification,
        manual_review_needed
      ) VALUES (
        NEW.product_name,
        classification_result.normalized_name,
        classification_result.quality_grade,
        classification_result.confidence,
        COALESCE(NEW.store_site, NEW.store_name, 'unknown'),
        classification_result.details,
        true
      ) ON CONFLICT (product_name) DO UPDATE SET
        confidence_score = GREATEST(meat_discovery_queue.confidence_score, EXCLUDED.confidence_score);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on scanner_products table
DROP TRIGGER IF EXISTS auto_discover_meat_cuts_trigger ON scanner_products;
CREATE TRIGGER auto_discover_meat_cuts_trigger
  AFTER INSERT ON scanner_products
  FOR EACH ROW
  EXECUTE FUNCTION auto_discover_meat_cuts();

-- Real Israeli market data population
-- Only insert if category exists and cut doesn't already exist
DO $$
DECLARE
    beef_category_id UUID;
BEGIN
    -- Get beef category ID
    SELECT id INTO beef_category_id FROM meat_categories WHERE name_hebrew = 'בקר' LIMIT 1;
    
    IF beef_category_id IS NOT NULL THEN
        -- Insert base normalized cuts from actual market analysis
        INSERT INTO meat_cuts (category_id, name_hebrew, name_english, normalized_cut_id, is_popular, quality_grade) 
        SELECT 
          beef_category_id,
          cuts.name_hebrew,
          cuts.name_english,
          cuts.normalized_id,
          cuts.is_popular,
          'regular'
        FROM (VALUES
          ('אנטריקוט בקר מתקדם', 'Enhanced Entrecote Beef', 'antrikot_beef_enhanced', true),
          ('פילה בקר מתקדם', 'Enhanced Filet Beef', 'file_beef_enhanced', true),
          ('סינטה בקר מתקדם', 'Enhanced Sirloin Beef', 'sinta_beef_enhanced', true),
          ('אונטריב בקר מתקדם', 'Enhanced Ribs Beef', 'unterib_beef_enhanced', true),
          ('בריסקט בקר מתקדם', 'Enhanced Brisket Beef', 'brisket_beef_enhanced', true),
          ('אסאדו בקר מתקדם', 'Enhanced Asado Beef', 'asado_beef_enhanced', true),
          ('כתף 5 בקר מתקדם', 'Enhanced Chuck Beef', 'katef_5_beef_enhanced', false),
          ('שריר מס 8 בקר מתקדם', 'Enhanced Arm Beef', 'shrir_8_beef_enhanced', false),
          ('פילה מדומה בקר מתקדם', 'Enhanced Mock Tender Beef', 'file_meduma_beef_enhanced', false),
          ('שייטל בקר מתקדם', 'Enhanced Rump Beef', 'shaytel_beef_enhanced', true),
          ('פיקניה בקר מתקדם', 'Enhanced Picanha Beef', 'picanha_beef_enhanced', true),
          ('טחון בקר מתקדם', 'Enhanced Ground Beef', 'tachun_beef_enhanced', true),
          ('כתף מרכזי 4 בקר מתקדם', 'Enhanced Chuck Center Beef', 'katef_merkazi_4_beef_enhanced', false),
          ('לשון בקר מתקדם', 'Enhanced Tongue Beef', 'lashon_beef_enhanced', false),
          ('מכסה אנטריקוט בקר מתקדם', 'Enhanced Ribeye Cap Beef', 'mekase_antrikot_beef_enhanced', false)
        ) AS cuts(name_hebrew, name_english, normalized_id, is_popular)
        WHERE NOT EXISTS (
            SELECT 1 FROM meat_cuts WHERE name_hebrew = cuts.name_hebrew
        );
    END IF;
END $$;

-- Populate sample mapping variations from real market data
DO $$
DECLARE
    antrikot_cut_id UUID;
BEGIN
    -- Get אנטריקוט cut ID
    SELECT id INTO antrikot_cut_id FROM meat_cuts WHERE name_hebrew LIKE '%אנטריקוט%' LIMIT 1;
    
    IF antrikot_cut_id IS NOT NULL THEN
        INSERT INTO meat_name_mappings (meat_cut_id, original_name, normalized_name, quality_grade, confidence_score, source)
        SELECT 
          antrikot_cut_id,
          variations.original,
          'אנטריקוט בקר',
          CASE 
            WHEN variations.original ILIKE '%אנגוס%' THEN 'angus'
            WHEN variations.original ILIKE '%וואגיו%' OR variations.original ILIKE '%wagyu%' THEN 'wagyu'
            WHEN variations.original ILIKE '%עגל%' THEN 'veal'
            WHEN variations.original ILIKE '%מיושן%' OR variations.original ILIKE '%פרמיום%' THEN 'premium'
            ELSE 'regular'
          END,
          0.95,
          'market_data'
        FROM (VALUES
          ('אנטריקוט טרי'),
          ('אנטריקוט אנגוס'),
          ('סטייק אנטריקוט'),
          ('אנטריקוט וואגיו'),
          ('אנטריקוט עגל'),
          ('אנטריקוט מיושן'),
          ('אנטריקוט פרמיום'),
          ('פילה בקר טרי'),
          ('פילה אנגוס'),
          ('סטייק פילה'),
          ('סינטה בקר טרי'),
          ('סינטה אנגוס'),
          ('טחון בקר'),
          ('בשר טחון'),
          ('בריסקט טרי'),
          ('חזה בקר')
        ) AS variations(original) 
        WHERE NOT EXISTS (
            SELECT 1 FROM meat_name_mappings WHERE original_name = variations.original
        );
    END IF;
END $$;

-- Create enhanced view for price data with intelligence
CREATE OR REPLACE VIEW enhanced_price_view AS
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
  NULL as scanner_source,
  mc.quality_grade,
  mc.normalized_cut_id,
  COALESCE(mnm.quality_grade, mc.quality_grade) as enhanced_quality_grade
FROM price_reports pr
JOIN meat_cuts mc ON pr.meat_cut_id = mc.id
JOIN retailers r ON pr.retailer_id = r.id
LEFT JOIN meat_name_mappings mnm ON pr.original_product_name = mnm.original_name
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
  sp.scanner_source,
  mc.quality_grade,
  mc.normalized_cut_id,
  COALESCE(mnm.quality_grade, mc.quality_grade) as enhanced_quality_grade
FROM scanner_products sp
LEFT JOIN meat_cuts mc ON sp.meat_cut_id = mc.id
LEFT JOIN meat_name_mappings mnm ON sp.product_name = mnm.original_name
WHERE sp.is_active = TRUE AND sp.is_valid = TRUE;

-- Create function to get enhanced meat data with intelligence
CREATE OR REPLACE FUNCTION get_enhanced_meat_data(category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  cut_id UUID,
  name_hebrew TEXT,
  name_english TEXT,
  normalized_cut_id VARCHAR,
  quality_grades JSONB,
  variations_count INTEGER,
  price_range JSONB,
  market_coverage INTEGER,
  is_popular BOOLEAN,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.name_hebrew,
    mc.name_english,
    mc.normalized_cut_id,
    COALESCE(
      json_agg(DISTINCT mnm.quality_grade) FILTER (WHERE mnm.quality_grade IS NOT NULL),
      '["regular"]'::json
    )::jsonb as quality_grades,
    COUNT(DISTINCT mnm.original_name)::INTEGER as variations_count,
    json_build_object(
      'min', MIN(epv.price_per_kg),
      'max', MAX(epv.price_per_kg),
      'avg', AVG(epv.price_per_kg)
    )::jsonb as price_range,
    COUNT(DISTINCT epv.retailer_id)::INTEGER as market_coverage,
    mc.is_popular,
    MAX(epv.created_at) as last_updated
  FROM meat_cuts mc
  LEFT JOIN meat_categories mcat ON mc.category_id = mcat.id
  LEFT JOIN meat_name_mappings mnm ON mc.id = mnm.meat_cut_id
  LEFT JOIN enhanced_price_view epv ON mc.id = epv.meat_cut_id
  WHERE mc.is_active = TRUE
    AND (category_filter IS NULL OR mcat.name_hebrew = category_filter)
  GROUP BY mc.id, mc.name_hebrew, mc.name_english, mc.normalized_cut_id, mc.is_popular
  ORDER BY mc.is_popular DESC, variations_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE meat_name_mappings IS 'Intelligent mapping system for Hebrew meat product names with quality classification';
COMMENT ON TABLE meat_discovery_queue IS 'Auto-discovery system for new meat cuts and variations';
COMMENT ON FUNCTION classify_meat_product IS 'Basic meat product classification function with Hebrew pattern matching';
COMMENT ON FUNCTION auto_discover_meat_cuts IS 'Auto-discovery trigger function for new meat cuts from scanner data';
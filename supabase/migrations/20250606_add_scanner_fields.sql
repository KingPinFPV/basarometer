-- Migration: 20250606_add_scanner_fields.sql
-- Add scanner-specific fields and functionality to support v5 scanner integration

-- Add scanner-specific columns to price_reports table
ALTER TABLE price_reports 
ADD COLUMN IF NOT EXISTS scanner_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS original_product_name TEXT,
ADD COLUMN IF NOT EXISTS scanner_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scanner_grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS detected_brand VARCHAR(100);

-- Create scanner ingestion log table for monitoring and analytics
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

-- Create scanner quality metrics table for real-time monitoring
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

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_source ON price_reports(scanner_source);
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_confidence ON price_reports(scanner_confidence);
CREATE INDEX IF NOT EXISTS idx_price_reports_scanner_grade ON price_reports(scanner_grade);
CREATE INDEX IF NOT EXISTS idx_price_reports_created_scanner ON price_reports(created_at) WHERE scanner_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scanner_logs_timestamp ON scanner_ingestion_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_site ON scanner_ingestion_logs(target_site);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_status ON scanner_ingestion_logs(status);

CREATE INDEX IF NOT EXISTS idx_scanner_metrics_date_site ON scanner_quality_metrics(scan_date, site_name);

-- Create enhanced view for scanner data quality monitoring
CREATE OR REPLACE VIEW scanner_quality_dashboard AS
SELECT 
  sqm.site_name,
  sqm.scan_date,
  sqm.total_products,
  sqm.high_confidence_products,
  sqm.avg_confidence,
  sqm.products_with_brand,
  ROUND((sqm.high_confidence_products::DECIMAL / sqm.total_products) * 100, 2) as high_quality_percentage,
  ROUND((sqm.products_with_brand::DECIMAL / sqm.total_products) * 100, 2) as brand_detection_percentage,
  sqm.grade_distribution,
  sqm.price_accuracy_score,
  sqm.processing_time_avg,
  CASE 
    WHEN sqm.avg_confidence >= 0.85 THEN 'Excellent'
    WHEN sqm.avg_confidence >= 0.7 THEN 'Good'
    WHEN sqm.avg_confidence >= 0.5 THEN 'Fair'
    ELSE 'Poor'
  END as quality_rating
FROM scanner_quality_metrics sqm
ORDER BY sqm.scan_date DESC, sqm.site_name;

-- Create real-time scanner status view
CREATE OR REPLACE VIEW live_scanner_status AS
SELECT 
  pr.scanner_source,
  COUNT(*) as products_today,
  AVG(pr.scanner_confidence) as avg_confidence_today,
  MAX(pr.created_at) as last_update,
  COUNT(CASE WHEN pr.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as products_last_hour,
  COUNT(CASE WHEN pr.scanner_confidence >= 0.85 THEN 1 END) as high_quality_today,
  COUNT(CASE WHEN pr.detected_brand IS NOT NULL THEN 1 END) as products_with_brand_today,
  string_agg(DISTINCT pr.scanner_grade, ', ') as grades_detected
FROM price_reports pr
WHERE DATE(pr.created_at) = CURRENT_DATE 
  AND pr.scanner_source IS NOT NULL
GROUP BY pr.scanner_source;

-- Create function to calculate daily scanner metrics
CREATE OR REPLACE FUNCTION calculate_scanner_metrics(scan_date DATE, site VARCHAR(50))
RETURNS VOID AS $$
DECLARE
  metrics_record RECORD;
BEGIN
  -- Calculate metrics for the given date and site
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN scanner_confidence >= 0.85 THEN 1 END) as high_conf,
    AVG(scanner_confidence) as avg_conf,
    COUNT(CASE WHEN detected_brand IS NOT NULL THEN 1 END) as with_brand,
    jsonb_object_agg(
      COALESCE(scanner_grade, 'unknown'), 
      COUNT(scanner_grade)
    ) as grade_dist,
    AVG(CASE WHEN price_per_kg > 0 THEN 1.0 ELSE 0.5 END) as price_acc
  INTO metrics_record
  FROM price_reports
  WHERE DATE(created_at) = scan_date 
    AND scanner_source = site;

  -- Insert or update metrics
  INSERT INTO scanner_quality_metrics (
    scan_date,
    site_name,
    total_products,
    high_confidence_products,
    avg_confidence,
    products_with_brand,
    grade_distribution,
    price_accuracy_score
  ) VALUES (
    scan_date,
    site,
    metrics_record.total,
    metrics_record.high_conf,
    metrics_record.avg_conf,
    metrics_record.with_brand,
    metrics_record.grade_dist,
    metrics_record.price_acc
  )
  ON CONFLICT (scan_date, site_name) 
  DO UPDATE SET
    total_products = EXCLUDED.total_products,
    high_confidence_products = EXCLUDED.high_confidence_products,
    avg_confidence = EXCLUDED.avg_confidence,
    products_with_brand = EXCLUDED.products_with_brand,
    grade_distribution = EXCLUDED.grade_distribution,
    price_accuracy_score = EXCLUDED.price_accuracy_score,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate metrics after scanner data insertion
CREATE OR REPLACE FUNCTION trigger_calculate_scanner_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for scanner-inserted data
  IF NEW.scanner_source IS NOT NULL THEN
    PERFORM calculate_scanner_metrics(DATE(NEW.created_at), NEW.scanner_source);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to price_reports table
DROP TRIGGER IF EXISTS scanner_metrics_trigger ON price_reports;
CREATE TRIGGER scanner_metrics_trigger
  AFTER INSERT ON price_reports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_scanner_metrics();

-- Add Row Level Security (RLS) policies for scanner data
ALTER TABLE scanner_ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view scanner logs and metrics
CREATE POLICY "Scanner logs viewable by authenticated users" 
  ON scanner_ingestion_logs FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Scanner metrics viewable by authenticated users"
  ON scanner_quality_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert scanner data
CREATE POLICY "Scanner system can insert logs"
  ON scanner_ingestion_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Scanner system can insert/update metrics"
  ON scanner_quality_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update existing price_reports RLS to handle scanner data
CREATE POLICY "Scanner data viewable by authenticated users" 
  ON price_reports FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Scanner system can insert price data"
  ON price_reports FOR INSERT
  TO service_role
  WITH CHECK (reported_by = 'scanner-system' OR user_id IS NOT NULL);

-- Create function to get scanner dashboard data
CREATE OR REPLACE FUNCTION get_scanner_dashboard_data()
RETURNS TABLE (
  site_name TEXT,
  products_today INTEGER,
  avg_confidence NUMERIC,
  last_update TIMESTAMP WITH TIME ZONE,
  products_last_hour INTEGER,
  quality_rating TEXT,
  trend_7d NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lss.scanner_source::TEXT,
    lss.products_today::INTEGER,
    ROUND(lss.avg_confidence_today, 3),
    lss.last_update,
    lss.products_last_hour::INTEGER,
    CASE 
      WHEN lss.avg_confidence_today >= 0.85 THEN 'Excellent'
      WHEN lss.avg_confidence_today >= 0.7 THEN 'Good'
      WHEN lss.avg_confidence_today >= 0.5 THEN 'Fair'
      ELSE 'Poor'
    END::TEXT,
    COALESCE(
      (SELECT AVG(total_products) 
       FROM scanner_quality_metrics sqm 
       WHERE sqm.site_name = lss.scanner_source 
         AND sqm.scan_date >= CURRENT_DATE - INTERVAL '7 days'), 
      0
    )::NUMERIC
  FROM live_scanner_status lss
  ORDER BY lss.products_today DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_scanner_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_scanner_metrics(DATE, VARCHAR) TO service_role;

-- Add helpful comments
COMMENT ON TABLE scanner_ingestion_logs IS 'Logs of scanner data ingestion operations for monitoring and debugging';
COMMENT ON TABLE scanner_quality_metrics IS 'Daily aggregated quality metrics for scanner data by site';
COMMENT ON VIEW scanner_quality_dashboard IS 'Comprehensive view of scanner data quality with ratings and percentages';
COMMENT ON VIEW live_scanner_status IS 'Real-time status of scanner operations for dashboard display';
COMMENT ON FUNCTION get_scanner_dashboard_data() IS 'Returns formatted dashboard data for scanner monitoring interface';

-- Insert initial test data (optional)
-- This can be removed in production
INSERT INTO scanner_ingestion_logs (target_site, total_products, processed_products, status, metadata)
VALUES 
  ('rami-levy', 45, 40, 'success', '{"test_mode": true, "categories": ["בקר", "עוף"]}'),
  ('shufersal', 32, 28, 'success', '{"test_mode": true, "categories": ["דגים", "אחר"]}')
ON CONFLICT DO NOTHING;
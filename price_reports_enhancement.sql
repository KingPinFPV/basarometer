-- Price Reports Enhancement for V3 + Auto-Profile System
-- Adds missing fields and updates schema for enhanced price reporting

-- Add missing columns to price_reports table
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS purchase_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS store_location TEXT;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_price INTEGER; -- in agorot, for sale prices
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Update existing reported_by column to use user_id if needed
UPDATE price_reports SET user_id = reported_by WHERE user_id IS NULL AND reported_by IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_reports_user ON price_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_price_reports_purchase_date ON price_reports(purchase_date);
CREATE INDEX IF NOT EXISTS idx_price_reports_sale_expires ON price_reports(sale_expires_at);

-- Enhanced RLS policies for price report submissions
DROP POLICY IF EXISTS "Users can insert their own price reports" ON price_reports;
CREATE POLICY "Users can insert their own price reports" ON price_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own price reports" ON price_reports;
CREATE POLICY "Users can update their own price reports" ON price_reports
FOR UPDATE USING (auth.uid() = user_id);

-- Function to validate price ranges
CREATE OR REPLACE FUNCTION validate_price_range(
  cut_id UUID,
  new_price INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  min_price INTEGER;
  max_price INTEGER;
BEGIN
  -- Get typical price range for the meat cut
  SELECT typical_price_range_min, typical_price_range_max 
  INTO min_price, max_price
  FROM meat_cuts 
  WHERE id = cut_id;
  
  -- Basic validation: price should be positive and reasonable
  IF new_price <= 0 OR new_price > 100000 THEN -- max 1000 NIS per kg
    RETURN FALSE;
  END IF;
  
  -- If we have typical ranges, validate against them (with some tolerance)
  IF min_price IS NOT NULL AND max_price IS NOT NULL THEN
    -- Allow prices up to 50% above max typical price (for premium cuts)
    IF new_price > (max_price * 1.5) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate confidence score based on user history
CREATE OR REPLACE FUNCTION calculate_confidence_score(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  report_count INTEGER;
  user_reputation INTEGER;
BEGIN
  -- Get user's total reports and reputation
  SELECT total_reports, reputation_score 
  INTO report_count, user_reputation
  FROM user_profiles 
  WHERE id = p_user_id;
  
  -- Default confidence score
  IF report_count IS NULL THEN report_count := 0; END IF;
  IF user_reputation IS NULL THEN user_reputation := 0; END IF;
  
  -- Calculate confidence based on experience
  IF report_count >= 50 AND user_reputation >= 100 THEN
    RETURN 5; -- Highest confidence
  ELSIF report_count >= 20 AND user_reputation >= 50 THEN
    RETURN 4;
  ELSIF report_count >= 10 AND user_reputation >= 20 THEN
    RETURN 3;
  ELSIF report_count >= 5 THEN
    RETURN 2;
  ELSE
    RETURN 1; -- New user
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user statistics after price report
CREATE OR REPLACE FUNCTION update_user_stats_on_price_report() RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total reports count
  UPDATE user_profiles 
  SET total_reports = total_reports + 1,
      reputation_score = reputation_score + 1
  WHERE id = NEW.user_id;
  
  -- If no profile exists, this will fail silently (handled by ensure_my_profile)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_stats ON price_reports;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON price_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_price_report();

-- Function to get latest prices for matrix display
CREATE OR REPLACE FUNCTION get_latest_prices_matrix() 
RETURNS TABLE (
  meat_cut_id UUID,
  retailer_id UUID,
  price_per_kg INTEGER,
  is_on_sale BOOLEAN,
  sale_price INTEGER,
  confidence_score INTEGER,
  report_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_reports AS (
    SELECT DISTINCT ON (pr.meat_cut_id, pr.retailer_id)
      pr.meat_cut_id,
      pr.retailer_id,
      pr.price_per_kg,
      pr.is_on_sale,
      pr.sale_price,
      pr.confidence_score,
      pr.created_at as last_updated,
      ROW_NUMBER() OVER (
        PARTITION BY pr.meat_cut_id, pr.retailer_id 
        ORDER BY pr.created_at DESC, pr.confidence_score DESC
      ) as rn
    FROM price_reports pr
    WHERE pr.is_active = true 
      AND pr.expires_at > NOW()
  ),
  report_counts AS (
    SELECT 
      pr.meat_cut_id,
      pr.retailer_id,
      COUNT(*) as total_reports
    FROM price_reports pr
    WHERE pr.is_active = true 
      AND pr.expires_at > NOW()
    GROUP BY pr.meat_cut_id, pr.retailer_id
  )
  SELECT 
    lr.meat_cut_id,
    lr.retailer_id,
    lr.price_per_kg,
    lr.is_on_sale,
    lr.sale_price,
    lr.confidence_score,
    COALESCE(rc.total_reports, 0) as report_count,
    lr.last_updated
  FROM latest_reports lr
  LEFT JOIN report_counts rc ON lr.meat_cut_id = rc.meat_cut_id 
    AND lr.retailer_id = rc.retailer_id
  WHERE lr.rn = 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_price_range(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_confidence_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_prices_matrix() TO anon, authenticated;

-- Comments for documentation
COMMENT ON FUNCTION validate_price_range IS 'Validates price ranges for meat cuts to prevent unrealistic prices';
COMMENT ON FUNCTION calculate_confidence_score IS 'Calculates user confidence score based on reporting history';
COMMENT ON FUNCTION get_latest_prices_matrix IS 'Returns latest prices optimized for matrix display with aggregated data';
COMMENT ON TRIGGER trigger_update_user_stats ON price_reports IS 'Updates user statistics when new price reports are submitted';
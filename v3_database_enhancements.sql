-- V3 Database Enhancements for Community Platform
-- Execute this in Supabase SQL Editor for Project ID: ergxrxtuncymyqslmoen
-- IMPORTANT: This preserves all existing V3 data while adding community features

-- =====================================================================
-- STEP 1: Enhance price_reports table with sale information
-- =====================================================================

-- Add new columns for advanced price reporting
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing notes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'price_reports' AND column_name = 'notes') THEN
    ALTER TABLE price_reports ADD COLUMN notes TEXT;
  END IF;
END $$;

-- =====================================================================
-- STEP 2: Create user_profiles table for community management
-- =====================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  reputation_score INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- =====================================================================
-- STEP 3: Create updated_at trigger for user_profiles
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- STEP 4: Create function to handle new user registration
-- =====================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================================
-- STEP 5: Enable Row Level Security
-- =====================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- STEP 6: Create RLS Policies for user_profiles
-- =====================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================================
-- STEP 7: Enhanced RLS for price_reports
-- =====================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert price reports" ON price_reports;
DROP POLICY IF EXISTS "Everyone can read price reports" ON price_reports;
DROP POLICY IF EXISTS "Users can update own price reports" ON price_reports;

-- Create new policies
CREATE POLICY "Authenticated users can insert price reports" ON price_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can read price reports" ON price_reports
  FOR SELECT USING (true);

CREATE POLICY "Users can update own price reports" ON price_reports
  FOR UPDATE USING (user_id = auth.uid()::text);

-- =====================================================================
-- STEP 8: Create indexes for performance
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_price_reports_sale ON price_reports(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_price_reports_user ON price_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_price_reports_reported_at ON price_reports(reported_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- =====================================================================
-- STEP 9: Add helpful comments for documentation
-- =====================================================================

COMMENT ON TABLE user_profiles IS 'User profiles with admin roles and community features for V3 platform';
COMMENT ON COLUMN price_reports.is_on_sale IS 'Whether the product is currently on sale';
COMMENT ON COLUMN price_reports.sale_price IS 'Discounted price when on sale';
COMMENT ON COLUMN price_reports.sale_expires_at IS 'When the sale expires';
COMMENT ON COLUMN price_reports.discount_percentage IS 'Percentage discount (calculated field)';
COMMENT ON COLUMN price_reports.reported_at IS 'When the price was reported by the user';
COMMENT ON COLUMN user_profiles.is_admin IS 'Whether user has admin privileges for management interface';
COMMENT ON COLUMN user_profiles.reputation_score IS 'User reputation based on price reporting accuracy';
COMMENT ON COLUMN user_profiles.total_reports IS 'Total number of price reports submitted by user';

-- =====================================================================
-- VERIFICATION: Display completion status
-- =====================================================================

DO $$
DECLARE
    price_reports_count INTEGER;
    user_profiles_exists BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Check price_reports table
    SELECT COUNT(*) INTO price_reports_count FROM price_reports;
    
    -- Check if user_profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) INTO user_profiles_exists;
    
    -- Check policies
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename IN ('price_reports', 'user_profiles');
    
    -- Success message
    RAISE NOTICE '========================================';
    RAISE NOTICE 'V3 DATABASE ENHANCEMENT COMPLETED! ✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Existing price_reports preserved: % records', price_reports_count;
    RAISE NOTICE 'User profiles table created: %', user_profiles_exists;
    RAISE NOTICE 'RLS policies created: % policies', policies_count;
    RAISE NOTICE 'New columns added to price_reports for sales';
    RAISE NOTICE 'Triggers and functions set up for user management';
    RAISE NOTICE 'Ready for user account creation!';
    RAISE NOTICE '========================================';
END $$;
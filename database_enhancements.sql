-- V3 Community Platform Database Enhancements
-- Enhance existing schema for user authentication and advanced price reporting

-- 1. Enhance existing price_reports table with sale details
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS sale_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE price_reports ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create user_profiles table (rename from profiles to avoid conflicts)
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

-- 3. Update existing profiles table to be admin field if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 4. Create trigger to update user_profiles updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS on new/enhanced tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin users can read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 7. Enhanced price reporting policies
-- Only authenticated users can insert price reports
CREATE POLICY "Authenticated users can insert price reports" ON price_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own price reports
CREATE POLICY "Users can update own price reports" ON price_reports
  FOR UPDATE USING (user_id = auth.uid()::text);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_reports_sale ON price_reports(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_price_reports_user ON price_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_price_reports_reported_at ON price_reports(reported_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON user_profiles(is_admin);

-- 9. Insert predefined admin users function
CREATE OR REPLACE FUNCTION create_predefined_users()
RETURNS void AS $$
DECLARE
    admin_emails text[] := ARRAY[
        'admin@basarometer.org',
        'admintest1@basarometer.org',
        'admintest2@basarometer.org'
    ];
    test_emails text[] := ARRAY[
        'test1@basarometer.org',
        'test2@basarometer.org'
    ];
    email text;
BEGIN
    -- Note: This function creates user profile entries
    -- Actual auth.users entries must be created via Supabase Auth API
    
    -- Create admin user profiles (will be linked when auth users are created)
    FOREACH email IN ARRAY admin_emails
    LOOP
        INSERT INTO user_profiles (id, full_name, is_admin, created_at, updated_at)
        VALUES (
            gen_random_uuid(), -- Temporary UUID, will be updated when linked to auth.users
            CASE 
                WHEN email = 'admin@basarometer.org' THEN 'בשרומטר מנהל'
                WHEN email = 'admintest1@basarometer.org' THEN 'מנהל בדיקות 1'
                WHEN email = 'admintest2@basarometer.org' THEN 'מנהל בדיקות 2'
            END,
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- Create test user profiles
    FOREACH email IN ARRAY test_emails
    LOOP
        INSERT INTO user_profiles (id, full_name, is_admin, created_at, updated_at)
        VALUES (
            gen_random_uuid(), -- Temporary UUID, will be updated when linked to auth.users
            CASE 
                WHEN email = 'test1@basarometer.org' THEN 'משתמש בדיקות 1'
                WHEN email = 'test2@basarometer.org' THEN 'משתמש בדיקות 2'
            END,
            false,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to handle new user registration
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User profiles with admin roles and community features';
COMMENT ON COLUMN price_reports.is_on_sale IS 'Whether the product is currently on sale';
COMMENT ON COLUMN price_reports.sale_price IS 'Discounted price when on sale';
COMMENT ON COLUMN price_reports.sale_expires_at IS 'When the sale expires';
COMMENT ON COLUMN price_reports.discount_percentage IS 'Percentage discount (calculated field)';
COMMENT ON COLUMN user_profiles.is_admin IS 'Whether user has admin privileges';
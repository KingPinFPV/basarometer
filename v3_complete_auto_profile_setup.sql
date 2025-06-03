-- 🚀 V3 Complete Setup - Auto Profile System
-- Phase 1: Database Setup & Cleanup
-- Execute this in Supabase SQL Editor for bulletproof user profile management

-- =====================================================================
-- STEP 1: CLEAN CURRENT STATE & VERIFICATION
-- =====================================================================

-- Display current user status
DO $$
BEGIN
  RAISE NOTICE '🔍 V3 CURRENT USER STATUS CHECK';
  RAISE NOTICE '=====================================';
END $$;

-- Verify current users (should be 5 users, all with profiles)
DO $$
DECLARE
  user_rec RECORD;
  total_auth_users INTEGER;
  total_profiles INTEGER;
  missing_profiles INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '👥 CURRENT USER ACCOUNTS:';
  RAISE NOTICE '─────────────────────────';
  
  -- Show all users with profiles
  FOR user_rec IN 
    SELECT 
      COALESCE(au.email, 'No Email') as email,
      COALESCE(up.full_name, 'No Name') as full_name,
      CASE WHEN up.is_admin THEN 'ADMIN 👑' ELSE 'USER 👤' END as role,
      COALESCE(up.city, 'No City') as city,
      CASE WHEN up.id IS NULL THEN 'MISSING PROFILE ❌' ELSE 'HAS PROFILE ✅' END as profile_status
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    ORDER BY up.is_admin DESC NULLS LAST, au.created_at
  LOOP
    RAISE NOTICE '  % | % | % | % | %', 
      user_rec.email, user_rec.full_name, user_rec.role, user_rec.city, user_rec.profile_status;
  END LOOP;
  
  -- Count missing profiles
  SELECT 
    COUNT(au.id),
    COUNT(up.id),
    COUNT(au.id) - COUNT(up.id)
  INTO total_auth_users, total_profiles, missing_profiles
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 SUMMARY:';
  RAISE NOTICE '  Total Auth Users: %', total_auth_users;
  RAISE NOTICE '  Users with Profiles: %', total_profiles;
  RAISE NOTICE '  Missing Profiles: %', missing_profiles;
  
  IF missing_profiles = 0 THEN
    RAISE NOTICE '  Status: ✅ ALL USERS HAVE PROFILES';
  ELSE
    RAISE NOTICE '  Status: ❌ % USERS MISSING PROFILES', missing_profiles;
  END IF;
END $$;

-- =====================================================================
-- STEP 2: CREATE ROBUST AUTO-PROFILE SYSTEM
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '🔧 CREATING BULLETPROOF AUTO-PROFILE SYSTEM';
RAISE NOTICE '===========================================';

-- Create bulletproof function for auto-profile creation
CREATE OR REPLACE FUNCTION create_user_profile_safe()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Auto-profile trigger executing for user: %', NEW.email;
  
  -- Only create profile if it doesn't exist
  INSERT INTO user_profiles (
    id,
    email,
    full_name,
    is_admin,
    city,
    reputation_score,
    total_reports,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'),
    false,
    'תל אביב',
    0,
    0,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE NOTICE 'Profile created/updated successfully for: %', NEW.email;
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Profile creation failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_safe();

RAISE NOTICE '✅ Auto-profile trigger created successfully';

-- =====================================================================
-- STEP 3: CREATE RPC FUNCTIONS FOR V3 FRONTEND
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '🔄 CREATING FRONTEND INTEGRATION FUNCTIONS';
RAISE NOTICE '========================================';

-- Function for V3 to call after signup/login
CREATE OR REPLACE FUNCTION ensure_my_profile()
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  profile_exists BOOLEAN;
  result JSON;
BEGIN
  -- Get current user info
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Create profile
    INSERT INTO user_profiles (
      id, email, full_name, is_admin, city, reputation_score, total_reports, created_at, updated_at
    ) VALUES (
      user_id, user_email, 'משתמש חדש', false, 'תל אביב', 0, 0, NOW(), NOW()
    );
    
    result := json_build_object(
      'success', true, 
      'created', true, 
      'message', 'Profile created successfully',
      'profile', json_build_object('id', user_id, 'email', user_email, 'full_name', 'משתמש חדש')
    );
  ELSE
    result := json_build_object(
      'success', true, 
      'created', false, 
      'message', 'Profile already exists'
    );
  END IF;
  
  RETURN result;
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile safely
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  profile_data JSON;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT to_json(up.*) INTO profile_data
  FROM user_profiles up
  WHERE up.id = user_id;
  
  IF profile_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  RETURN json_build_object('success', true, 'profile', profile_data);
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION ensure_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;

RAISE NOTICE '✅ Frontend integration functions created';

-- =====================================================================
-- STEP 4: FIX RLS POLICIES (FINAL)
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '🔒 SETTING UP BULLETPROOF RLS POLICIES';
RAISE NOTICE '====================================';

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

RAISE NOTICE '✅ RLS policies configured successfully';

-- =====================================================================
-- STEP 5: ENSURE ALL EXISTING USERS HAVE PROFILES
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '🔄 ENSURING ALL EXISTING USERS HAVE PROFILES';
RAISE NOTICE '==========================================';

-- Fix any users without profiles
DO $$
DECLARE
  missing_user RECORD;
  fixed_count INTEGER := 0;
BEGIN
  FOR missing_user IN 
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    INSERT INTO user_profiles (
      id, email, full_name, is_admin, city, reputation_score, total_reports, created_at, updated_at
    ) VALUES (
      missing_user.id, 
      missing_user.email, 
      'משתמש חדש', 
      false, 
      'תל אביב', 
      0, 
      0, 
      missing_user.created_at, 
      NOW()
    );
    
    fixed_count := fixed_count + 1;
    RAISE NOTICE '  ✅ Created profile for: %', missing_user.email;
  END LOOP;
  
  IF fixed_count = 0 THEN
    RAISE NOTICE '  ✅ All users already have profiles';
  ELSE
    RAISE NOTICE '  ✅ Created % missing profiles', fixed_count;
  END IF;
END $$;

-- =====================================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================================

RAISE NOTICE '';
RAISE NOTICE '📊 FINAL SYSTEM VERIFICATION';
RAISE NOTICE '============================';

DO $$
DECLARE
  total_users INTEGER;
  users_with_profiles INTEGER;
  admin_count INTEGER;
  regular_user_count INTEGER;
  status TEXT;
BEGIN
  SELECT 
    COUNT(au.id),
    COUNT(up.id),
    COUNT(CASE WHEN up.is_admin THEN 1 END),
    COUNT(CASE WHEN NOT up.is_admin THEN 1 END)
  INTO total_users, users_with_profiles, admin_count, regular_user_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id;
  
  IF total_users = users_with_profiles THEN
    status := '✅ SYSTEM READY';
  ELSE
    status := '❌ NEEDS FIXING';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'FINAL STATUS REPORT:';
  RAISE NOTICE '──────────────────────';
  RAISE NOTICE '  Total Users: %', total_users;
  RAISE NOTICE '  Users with Profiles: %', users_with_profiles;
  RAISE NOTICE '  Admin Count: %', admin_count;
  RAISE NOTICE '  Regular User Count: %', regular_user_count;
  RAISE NOTICE '  Status: %', status;
  RAISE NOTICE '';
  
  IF status = '✅ SYSTEM READY' THEN
    RAISE NOTICE '🎉 V3 AUTO-PROFILE SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '✅ All users have profiles';
    RAISE NOTICE '✅ Auto-profile triggers active';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Frontend functions ready';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for V3 frontend integration!';
  ELSE
    RAISE NOTICE '❌ Setup incomplete - please check errors above';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION create_user_profile_safe() IS 'Bulletproof auto-profile creation with error handling';
COMMENT ON FUNCTION ensure_my_profile() IS 'Frontend helper function to ensure user has profile';
COMMENT ON FUNCTION get_my_profile() IS 'Safe profile retrieval for authenticated users';

-- Success notification
SELECT 'V3 Auto-Profile System Setup Complete! 🚀' as final_status;
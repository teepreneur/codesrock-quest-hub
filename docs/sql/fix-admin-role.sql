-- =============================================
-- FORCE FIX: Super Admin Role
-- =============================================

-- 1. Update auth.users metadata (Source of Truth for Auth)
UPDATE auth.users
SET raw_user_meta_data = 
  jsonb_set(
    CASE 
      WHEN raw_user_meta_data IS NULL THEN '{}'::jsonb
      ELSE raw_user_meta_data
    END,
    '{role}',
    '"super_admin"'
  ),
  is_super_admin = true
WHERE email = 'hello@codesrock.com';

-- 2. Update profiles table (Source of Truth for App)
-- We use a DO block to ensure it runs even if RLS is tricky
DO $$
BEGIN
  UPDATE profiles 
  SET role = 'super_admin',
      first_name = 'CodesRock',
      last_name = 'Admin'
  WHERE email = 'hello@codesrock.com';
END $$;

-- 3. VERIFICATION (Check both tables)
SELECT 
  au.email, 
  au.raw_user_meta_data->>'role' as auth_meta_role,
  p.role as profile_role,
  p.first_name,
  p.last_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'hello@codesrock.com';

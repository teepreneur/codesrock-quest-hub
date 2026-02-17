-- =============================================
-- CodesRock Quest Hub - Create Test User Accounts
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates two accounts that can sign in via the app
-- =============================================

-- Enable pgcrypto if not already enabled (needed for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 1. TEACHER ACCOUNT
--    Email:    bambinidevelopment@gmail.com
--    Password: 6122013@bambiniteacher
-- =============================================

DO $$
DECLARE
  teacher_uid UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    teacher_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bambinidevelopment@gmail.com',
    crypt('6122013@bambiniteacher', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Bambini","last_name":"Development"}',
    FALSE,
    NOW(),
    NOW(),
    '',
    ''
  );

  -- Insert into auth.identities (required for Supabase Auth sign-in)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    teacher_uid,
    teacher_uid::text,
    jsonb_build_object(
      'sub', teacher_uid::text,
      'email', 'bambinidevelopment@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Note: The handle_new_user() trigger will auto-create:
  --   - profiles row (role defaults to 'teacher')
  --   - user_progress row
  -- So no manual insert needed for those tables.

  RAISE NOTICE 'Teacher account created: bambinidevelopment@gmail.com (ID: %)', teacher_uid;
END $$;


-- =============================================
-- 2. SUPER ADMIN ACCOUNT
--    Email:    hello@codesrock.com
--    Password: 6122013@codesrocksuperadmin
-- =============================================

DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'hello@codesrock.com',
    crypt('6122013@codesrocksuperadmin', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"CodesRock","last_name":"Admin"}',
    FALSE,
    NOW(),
    NOW(),
    '',
    ''
  );

  -- Insert into auth.identities (required for Supabase Auth sign-in)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_uid,
    admin_uid::text,
    jsonb_build_object(
      'sub', admin_uid::text,
      'email', 'hello@codesrock.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- The trigger auto-creates profile with role='teacher'.
  -- Now update the role to 'super_admin'.
  UPDATE profiles
  SET role = 'super_admin'
  WHERE id = admin_uid;

  RAISE NOTICE 'Super admin account created: hello@codesrock.com (ID: %)', admin_uid;
END $$;


-- =============================================
-- VERIFICATION: Check that both accounts exist
-- =============================================
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.is_active,
  p.created_at
FROM profiles p
WHERE p.email IN ('bambinidevelopment@gmail.com', 'hello@codesrock.com')
ORDER BY p.created_at;

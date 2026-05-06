-- =============================================
-- Migration: Remove Rigid Category Constraints
-- =============================================

-- 1. Drop the check constraint on courses table
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_check;

-- 2. Ensure category is just a flexible text field
-- (No changes needed if it's already TEXT, but we ensure it's not locked down)

-- 3. (Optional but recommended) Add a separate categories table for better management later
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS for categories
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- 5. Add Policy for admins
CREATE POLICY "Admins can manage categories" ON content_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'content_admin')
    )
  );

-- 6. Add Policy for everyone to read
CREATE POLICY "Anyone can read categories" ON content_categories
  FOR SELECT USING (true);

-- ============================================================
-- CodesRock RLS Policies for Topics & Videos
-- Run this in the Supabase SQL Editor
-- ============================================================
-- This fixes the 500 error: "new row violates row-level security 
-- policy for table 'topics'" by adding proper RLS policies.
--
-- The service_role key bypasses RLS automatically, but if the
-- Render deployment's SUPABASE_SERVICE_KEY env var is accidentally
-- set to the anon key, these policies ensure it still works for
-- authenticated admin users.
-- ============================================================

-- ===================== TOPICS TABLE =====================

-- Enable RLS (idempotent — safe to re-run)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active topics
DROP POLICY IF EXISTS "Anyone can read active topics" ON topics;
CREATE POLICY "Anyone can read active topics"
  ON topics FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all topics (including inactive, for admins)
DROP POLICY IF EXISTS "Authenticated users can read all topics" ON topics;
CREATE POLICY "Authenticated users can read all topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert topics
DROP POLICY IF EXISTS "Authenticated users can insert topics" ON topics;
CREATE POLICY "Authenticated users can insert topics"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update topics
DROP POLICY IF EXISTS "Authenticated users can update topics" ON topics;
CREATE POLICY "Authenticated users can update topics"
  ON topics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete topics
DROP POLICY IF EXISTS "Authenticated users can delete topics" ON topics;
CREATE POLICY "Authenticated users can delete topics"
  ON topics FOR DELETE
  TO authenticated
  USING (true);

-- ===================== VIDEOS TABLE =====================

-- Enable RLS (idempotent)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active videos
DROP POLICY IF EXISTS "Anyone can read active videos" ON videos;
CREATE POLICY "Anyone can read active videos"
  ON videos FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to read all videos
DROP POLICY IF EXISTS "Authenticated users can read all videos" ON videos;
CREATE POLICY "Authenticated users can read all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert videos
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON videos;
CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update videos
DROP POLICY IF EXISTS "Authenticated users can update videos" ON videos;
CREATE POLICY "Authenticated users can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete videos
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON videos;
CREATE POLICY "Authenticated users can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (true);

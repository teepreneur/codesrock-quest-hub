-- ============================================================
-- CodesRock RLS Policies for Topics & Videos
-- Run this in the Supabase SQL Editor
-- ============================================================
-- Fixes: "new row violates row-level security policy"
-- These policies allow ALL roles (anon + authenticated) to
-- perform CRUD on topics and videos. The actual access control
-- is handled by the Express middleware (protect + requireContentAdmin).
-- ============================================================

-- ===================== TOPICS TABLE =====================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- SELECT: allow all
DROP POLICY IF EXISTS "Anyone can read active topics" ON topics;
DROP POLICY IF EXISTS "Authenticated users can read all topics" ON topics;
DROP POLICY IF EXISTS "Allow all select on topics" ON topics;
CREATE POLICY "Allow all select on topics"
  ON topics FOR SELECT
  USING (true);

-- INSERT: allow all (backend middleware handles auth)
DROP POLICY IF EXISTS "Authenticated users can insert topics" ON topics;
DROP POLICY IF EXISTS "Allow all insert on topics" ON topics;
CREATE POLICY "Allow all insert on topics"
  ON topics FOR INSERT
  WITH CHECK (true);

-- UPDATE: allow all
DROP POLICY IF EXISTS "Authenticated users can update topics" ON topics;
DROP POLICY IF EXISTS "Allow all update on topics" ON topics;
CREATE POLICY "Allow all update on topics"
  ON topics FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE: allow all
DROP POLICY IF EXISTS "Authenticated users can delete topics" ON topics;
DROP POLICY IF EXISTS "Allow all delete on topics" ON topics;
CREATE POLICY "Allow all delete on topics"
  ON topics FOR DELETE
  USING (true);

-- ===================== VIDEOS TABLE =====================

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- SELECT: allow all
DROP POLICY IF EXISTS "Anyone can read active videos" ON videos;
DROP POLICY IF EXISTS "Authenticated users can read all videos" ON videos;
DROP POLICY IF EXISTS "Allow all select on videos" ON videos;
CREATE POLICY "Allow all select on videos"
  ON videos FOR SELECT
  USING (true);

-- INSERT: allow all
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON videos;
DROP POLICY IF EXISTS "Allow all insert on videos" ON videos;
CREATE POLICY "Allow all insert on videos"
  ON videos FOR INSERT
  WITH CHECK (true);

-- UPDATE: allow all
DROP POLICY IF EXISTS "Authenticated users can update videos" ON videos;
DROP POLICY IF EXISTS "Allow all update on videos" ON videos;
CREATE POLICY "Allow all update on videos"
  ON videos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE: allow all
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON videos;
DROP POLICY IF EXISTS "Allow all delete on videos" ON videos;
CREATE POLICY "Allow all delete on videos"
  ON videos FOR DELETE
  USING (true);

-- =============================================
-- CodesRock Teacher Portal - RLS Policies
-- =============================================
-- Run this AFTER supabase-schema.sql
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'school_admin', 'content_admin')
    )
  );

-- Admins can insert profiles
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'school_admin')
    )
  );

-- Admins can update other profiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'school_admin')
    )
  );

-- =============================================
-- SCHOOLS POLICIES
-- =============================================

-- Everyone can view schools
CREATE POLICY "Schools are viewable by all authenticated users"
  ON schools FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage schools
CREATE POLICY "Admins can manage schools"
  ON schools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'school_admin')
    )
  );

-- =============================================
-- USER PROGRESS POLICIES
-- =============================================

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Everyone can view leaderboard (public progress data)
CREATE POLICY "Public can view leaderboard"
  ON user_progress FOR SELECT
  USING (true);

-- System can insert progress
CREATE POLICY "System can create progress"
  ON user_progress FOR INSERT
  WITH CHECK (true);

-- =============================================
-- BADGES POLICIES
-- =============================================

-- Everyone can view badges
CREATE POLICY "Badges are viewable by all"
  ON badges FOR SELECT
  USING (true);

-- Only content admins can manage badges
CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'content_admin')
    )
  );

-- =============================================
-- USER BADGES POLICIES
-- =============================================

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view public badges (for profiles)
CREATE POLICY "Public can view user badges"
  ON user_badges FOR SELECT
  USING (true);

-- System can award badges
CREATE POLICY "System can create user badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- COURSES POLICIES
-- =============================================

-- Everyone can view active courses
CREATE POLICY "Courses are viewable by all"
  ON courses FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Content admins can manage courses
CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'content_admin')
    )
  );

-- =============================================
-- VIDEO PROGRESS POLICIES
-- =============================================

-- Users can view their own video progress
CREATE POLICY "Users can view own video progress"
  ON video_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own video progress
CREATE POLICY "Users can upsert own video progress"
  ON video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress"
  ON video_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- RESOURCES POLICIES
-- =============================================

-- Everyone can view active resources
CREATE POLICY "Resources are viewable by all"
  ON resources FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Content admins can manage resources
CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'content_admin')
    )
  );

-- =============================================
-- RESOURCE DOWNLOADS POLICIES
-- =============================================

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads"
  ON resource_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can track their downloads
CREATE POLICY "Users can create downloads"
  ON resource_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ACTIVITIES POLICIES
-- =============================================

-- Users can view their own activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Everyone can view recent public activities (for feed)
CREATE POLICY "Public can view recent activities"
  ON activities FOR SELECT
  USING (true);

-- =============================================
-- TRAINING SESSIONS POLICIES
-- =============================================

-- Everyone can view training sessions
CREATE POLICY "Training sessions are viewable by all"
  ON training_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Content admins can manage training sessions
CREATE POLICY "Admins can manage training sessions"
  ON training_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'content_admin')
    )
  );

-- =============================================
-- SESSION REGISTRATIONS POLICIES
-- =============================================

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON session_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can register for sessions
CREATE POLICY "Users can create registrations"
  ON session_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations"
  ON session_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
  ON session_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'content_admin')
    )
  );

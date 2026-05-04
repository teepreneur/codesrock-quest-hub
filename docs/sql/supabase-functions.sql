-- =============================================
-- CodesRock Teacher Portal - PostgreSQL Functions
-- =============================================
-- Run this AFTER supabase-rls-policies.sql
-- =============================================

-- =============================================
-- XP AND LEVELING FUNCTIONS
-- =============================================

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS TABLE(level INTEGER, level_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN xp < 100 THEN 1
      WHEN xp < 250 THEN 2
      WHEN xp < 450 THEN 3
      WHEN xp < 700 THEN 4
      WHEN xp < 1000 THEN 5
      WHEN xp < 1350 THEN 6
      WHEN xp < 1750 THEN 7
      ELSE 8
    END AS level,
    CASE
      WHEN xp < 100 THEN 'Code Cadet'
      WHEN xp < 250 THEN 'Tech Explorer'
      WHEN xp < 450 THEN 'Digital Creator'
      WHEN xp < 700 THEN 'Innovation Scout'
      WHEN xp < 1000 THEN 'Tech Mentor'
      WHEN xp < 1350 THEN 'Digital Champion'
      WHEN xp < 1750 THEN 'Innovation Leader'
      ELSE 'CodesRock Champion'
    END AS level_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to award XP
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_description TEXT
)
RETURNS JSON AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_level_name TEXT;
  v_level_up BOOLEAN DEFAULT false;
  v_result RECORD;
BEGIN
  -- Get current XP and level
  SELECT current_xp, current_level INTO v_current_xp, v_old_level
  FROM user_progress
  WHERE user_id = p_user_id;

  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_amount;

  -- Calculate new level
  SELECT level, level_name INTO v_new_level, v_level_name
  FROM calculate_level(v_new_xp);

  -- Check if level up
  v_level_up := v_new_level > v_old_level;

  -- Update user progress
  UPDATE user_progress
  SET
    current_xp = v_new_xp,
    total_xp = total_xp + p_xp_amount,
    current_level = v_new_level,
    level_name = v_level_name,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log activity
  INSERT INTO activities (user_id, type, description, xp_earned)
  VALUES (p_user_id, p_activity_type, p_description, p_xp_amount);

  -- If level up, log that too
  IF v_level_up THEN
    INSERT INTO activities (user_id, type, description, xp_earned)
    VALUES (p_user_id, 'level_up', 'Reached ' || v_level_name, 0);
  END IF;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'new_xp', v_new_xp,
    'xp_awarded', p_xp_amount,
    'level_up', v_level_up,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'level_name', v_level_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STREAK FUNCTIONS
-- =============================================

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_streak_maintained BOOLEAN;
BEGIN
  -- Get last activity date and current streak
  SELECT last_activity_date, streak INTO v_last_activity, v_current_streak
  FROM user_progress
  WHERE user_id = p_user_id;

  -- Calculate new streak
  IF v_last_activity = CURRENT_DATE THEN
    -- Already active today
    v_new_streak := v_current_streak;
    v_streak_maintained := true;
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
    v_streak_maintained := true;

    -- Check for streak milestones
    IF v_new_streak IN (7, 14, 30, 60, 90) THEN
      INSERT INTO activities (user_id, type, description)
      VALUES (p_user_id, 'streak_milestone', v_new_streak || '-day streak achieved!');
    END IF;
  ELSE
    -- Streak broken
    v_new_streak := 1;
    v_streak_maintained := false;
  END IF;

  -- Update streak
  UPDATE user_progress
  SET
    streak = v_new_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'streak', v_new_streak,
    'streak_maintained', v_streak_maintained,
    'previous_streak', v_current_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COURSE COMPLETION FUNCTION
-- =============================================

-- Complete a course and award XP
CREATE OR REPLACE FUNCTION complete_course(
  p_course_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_course RECORD;
  v_already_completed BOOLEAN;
  v_xp_result JSON;
BEGIN
  -- Get course details
  SELECT * INTO v_course
  FROM courses
  WHERE id = p_course_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Course not found');
  END IF;

  -- Check if already completed and XP awarded
  SELECT xp_awarded INTO v_already_completed
  FROM video_progress
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF v_already_completed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Course already completed',
      'xp_awarded', 0
    );
  END IF;

  -- Mark as completed
  INSERT INTO video_progress (
    user_id,
    course_id,
    completed,
    completed_at,
    xp_awarded,
    watch_percentage
  )
  VALUES (
    p_user_id,
    p_course_id,
    true,
    NOW(),
    true,
    100
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    completed = true,
    completed_at = NOW(),
    xp_awarded = true,
    watch_percentage = 100;

  -- Award XP
  SELECT award_xp(
    p_user_id,
    v_course.xp_reward,
    'video_completed',
    'Completed "' || v_course.title || '"'
  ) INTO v_xp_result;

  RETURN json_build_object(
    'success', true,
    'course_title', v_course.title,
    'xp_awarded', v_course.xp_reward,
    'level_info', v_xp_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RESOURCE DOWNLOAD FUNCTION
-- =============================================

-- Track resource download and award XP
CREATE OR REPLACE FUNCTION download_resource(
  p_resource_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_resource RECORD;
  v_already_downloaded BOOLEAN;
  v_xp_result JSON;
BEGIN
  -- Get resource details
  SELECT * INTO v_resource
  FROM resources
  WHERE id = p_resource_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Resource not found');
  END IF;

  -- Check if already downloaded
  SELECT xp_awarded INTO v_already_downloaded
  FROM resource_downloads
  WHERE user_id = p_user_id AND resource_id = p_resource_id;

  IF v_already_downloaded THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Resource already downloaded',
      'xp_awarded', 0
    );
  END IF;

  -- Track download
  INSERT INTO resource_downloads (
    user_id,
    resource_id,
    xp_awarded
  )
  VALUES (
    p_user_id,
    p_resource_id,
    true
  )
  ON CONFLICT (user_id, resource_id)
  DO UPDATE SET
    downloaded_at = NOW(),
    xp_awarded = true;

  -- Increment download count
  UPDATE resources
  SET download_count = download_count + 1
  WHERE id = p_resource_id;

  -- Award XP
  SELECT award_xp(
    p_user_id,
    v_resource.xp_reward,
    'resource_downloaded',
    'Downloaded "' || v_resource.title || '"'
  ) INTO v_xp_result;

  RETURN json_build_object(
    'success', true,
    'resource_title', v_resource.title,
    'xp_awarded', v_resource.xp_reward,
    'level_info', v_xp_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Get overall analytics overview
CREATE OR REPLACE FUNCTION get_analytics_overview()
RETURNS JSON AS $$
DECLARE
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_total_courses INTEGER;
  v_completed_courses INTEGER;
  v_total_resources INTEGER;
  v_total_downloads INTEGER;
  v_avg_xp NUMERIC;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE is_active = true;

  -- Count active users (logged in last 30 days)
  SELECT COUNT(*) INTO v_active_users
  FROM profiles
  WHERE last_login > NOW() - INTERVAL '30 days';

  -- Count courses
  SELECT COUNT(*) INTO v_total_courses FROM courses WHERE is_active = true;

  -- Count completed courses
  SELECT COUNT(*) INTO v_completed_courses
  FROM video_progress
  WHERE completed = true;

  -- Count resources
  SELECT COUNT(*) INTO v_total_resources FROM resources WHERE is_active = true;

  -- Count downloads
  SELECT COUNT(*) INTO v_total_downloads FROM resource_downloads;

  -- Average XP
  SELECT AVG(current_xp)::NUMERIC(10,2) INTO v_avg_xp FROM user_progress;

  RETURN json_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_courses', v_total_courses,
    'completed_courses', v_completed_courses,
    'total_resources', v_total_resources,
    'total_downloads', v_total_downloads,
    'average_xp', v_avg_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  current_xp INTEGER,
  current_level INTEGER,
  level_name TEXT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    p.first_name,
    p.last_name,
    up.current_xp,
    up.current_level,
    up.level_name,
    ROW_NUMBER() OVER (ORDER BY up.current_xp DESC) AS rank
  FROM user_progress up
  JOIN profiles p ON up.user_id = p.id
  WHERE p.is_active = true
  ORDER BY up.current_xp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

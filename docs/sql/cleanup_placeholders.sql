-- Migration: Cleanup Placeholder Data
-- Description: Removes premature HTML, CSS, and JavaScript placeholders from badges, courses, and resources.

-- 1. Remove placeholder badges
DELETE FROM badges 
WHERE name IN ('HTML Master', 'JavaScript Ninja');

-- 2. Remove placeholder courses
-- These were added by the initial seed script and shouldn't exist until the admin creates them
DELETE FROM courses 
WHERE category IN ('HTML/CSS', 'JavaScript');

-- 3. Remove placeholder resources
DELETE FROM resources 
WHERE subject IN ('HTML', 'CSS', 'JavaScript') 
   OR title LIKE '%HTML%' 
   OR title LIKE '%CSS%' 
   OR title LIKE '%JavaScript%';

-- 4. Restrict Leaderboard to Teachers only
DROP FUNCTION IF EXISTS get_leaderboard(integer);
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT,
  current_xp INTEGER,
  total_xp INTEGER,
  current_level INTEGER,
  level_name TEXT,
  badge_count BIGINT,
  streak INTEGER,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    up.current_xp,
    up.total_xp,
    up.current_level,
    up.level_name,
    (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = up.user_id) as badge_count,
    up.streak,
    ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) AS rank
  FROM user_progress up
  JOIN profiles p ON up.user_id = p.id
  WHERE p.is_active = true 
    AND p.role = 'teacher'  -- Only show teachers on the leaderboard
  ORDER BY up.total_xp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

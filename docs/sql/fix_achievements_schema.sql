-- Migration: Fix Badges Schema and Leaderboard
-- Description: Adds rarity and xp_reward to badges, and improves leaderboard data.

-- 1. Update badges table
ALTER TABLE badges ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Common' CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary'));
ALTER TABLE badges ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10;

-- Update existing badges to have some XP reward if they had points
UPDATE badges SET xp_reward = points WHERE xp_reward IS NULL OR xp_reward = 10;

-- 2. Improve get_leaderboard function
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
  ORDER BY up.total_xp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

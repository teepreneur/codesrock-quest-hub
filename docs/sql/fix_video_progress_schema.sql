-- =============================================
-- FIX: Video Progress Table Schema
-- Adds missing video_id and updates unique constraint
-- =============================================

-- 1. Add video_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_progress' AND column_name = 'video_id') THEN
        ALTER TABLE video_progress ADD COLUMN video_id UUID REFERENCES videos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Drop the old course-based unique constraint if it exists
-- Usually named video_progress_user_id_course_id_key
ALTER TABLE video_progress DROP CONSTRAINT IF EXISTS video_progress_user_id_course_id_key;

-- 3. Add the correct video-based unique constraint
ALTER TABLE video_progress DROP CONSTRAINT IF EXISTS video_progress_user_id_video_id_key;
ALTER TABLE video_progress ADD CONSTRAINT video_progress_user_id_video_id_key UNIQUE (user_id, video_id);

-- 4. Ensure award_xp function is correctly defined with metadata support
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
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
  v_new_xp := COALESCE(v_current_xp, 0) + p_xp_amount;

  -- Calculate new level
  SELECT level, level_name INTO v_new_level, v_level_name
  FROM calculate_level(v_new_xp);

  -- Check if level up
  v_level_up := v_new_level > COALESCE(v_old_level, 0);

  -- Update user progress
  INSERT INTO user_progress (user_id, current_xp, total_xp, current_level, level_name, last_activity_date, updated_at)
  VALUES (p_user_id, v_new_xp, p_xp_amount, v_new_level, v_level_name, CURRENT_DATE, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_xp = v_new_xp,
    total_xp = user_progress.total_xp + p_xp_amount,
    current_level = v_new_level,
    level_name = v_level_name,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();

  -- Log activity with metadata
  INSERT INTO activities (user_id, type, description, xp_earned, metadata)
  VALUES (p_user_id, p_activity_type, p_description, p_xp_amount, p_metadata);

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

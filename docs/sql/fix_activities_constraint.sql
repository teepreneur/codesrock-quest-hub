-- Migration: Fix Activities Table Type Constraint
-- Description: Updates the allowed activity types to include evaluations, sessions, and other gamification events.

-- 1. Identify and drop the existing check constraint
-- Usually named 'activities_type_check' by default
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- 2. Add the new comprehensive constraint
ALTER TABLE activities ADD CONSTRAINT activities_type_check CHECK (
  type IN (
    'video_started',
    'video_completed',
    'evaluation_submitted',
    'evaluation_completed',
    'evaluation_passed',
    'resource_downloaded',
    'badge_earned',
    'level_up',
    'streak_milestone',
    'session_registered',
    'session_attended',
    'xp_awarded',
    'achievement',
    'login'
  )
);

-- 3. Also ensure we have a function to manually trigger XP update for existing failures
-- This helps if a user already passed but didn't get points
CREATE OR REPLACE FUNCTION fix_missing_evaluation_xp(p_user_id UUID, p_evaluation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_progress RECORD;
  v_evaluation RECORD;
  v_result JSON;
BEGIN
  -- Check if passed but not awarded
  SELECT * INTO v_progress 
  FROM evaluation_progress 
  WHERE user_id = p_user_id AND evaluation_id = p_evaluation_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Progress record not found');
  END IF;
  
  IF NOT v_progress.passed THEN
    RETURN json_build_object('success', false, 'message', 'Evaluation not passed yet');
  END IF;
  
  IF v_progress.xp_awarded THEN
    RETURN json_build_object('success', false, 'message', 'XP already awarded');
  END IF;
  
  -- Get XP amount
  SELECT title, xp_reward INTO v_evaluation FROM evaluations WHERE id = p_evaluation_id;
  
  -- Award XP
  SELECT award_xp(
    p_user_id,
    v_evaluation.xp_reward,
    'evaluation_completed',
    'Passed evaluation: ' || v_evaluation.title,
    json_build_object('evaluationId', p_evaluation_id, 'score', v_progress.score)
  ) INTO v_result;
  
  -- Mark as awarded
  UPDATE evaluation_progress SET xp_awarded = true WHERE id = v_progress.id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

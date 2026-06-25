-- ============================================================
-- Migration: Add Granular Student Progress Tracking
-- Adds detailed metrics for classroom activities
-- ============================================================

ALTER TABLE student_topic_progress 
  ADD COLUMN IF NOT EXISTS mastery_level TEXT CHECK (mastery_level IN ('struggling', 'developing', 'proficient', 'advanced')),
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER CHECK (engagement_score >= 1 AND engagement_score <= 5),
  ADD COLUMN IF NOT EXISTS assessment_score INTEGER,
  ADD COLUMN IF NOT EXISTS max_assessment_score INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('unplugged_game', 'card_sorting', 'robot_navigation', 'activity_book')),
  ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;

-- ============================================================
-- CodesRock Evaluation System Migration
-- Adds dynamic quizzes at the end of every module (topic)
-- ============================================================

-- 1. Create 'evaluations' table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 500, -- High points for final evaluation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id)
);

-- 2. Create 'evaluation_questions' table
CREATE TABLE IF NOT EXISTS evaluation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  options JSONB NOT NULL, -- Array of strings for choices
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create 'evaluation_progress' table to track completion
CREATE TABLE IF NOT EXISTS evaluation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE NOT NULL,
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT now(),
  xp_awarded BOOLEAN DEFAULT false,
  UNIQUE(user_id, evaluation_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_topic_id ON evaluations(topic_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_questions_eval_id ON evaluation_questions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_progress_user_id ON evaluation_progress(user_id);

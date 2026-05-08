-- Fix RLS for Evaluations
-- Description: Allow admins to manage evaluations and users to view them.

-- 1. Evaluations Table
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evaluations" ON evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'content_admin')
    )
  );

CREATE POLICY "Users can view active evaluations" ON evaluations
  FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. Evaluation Questions Table
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage questions" ON evaluation_questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'content_admin')
    )
  );

CREATE POLICY "Users can view questions" ON evaluation_questions
  FOR SELECT TO authenticated
  USING (true);

-- 3. Evaluation Progress Table
ALTER TABLE evaluation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON evaluation_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own progress" ON evaluation_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON evaluation_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all progress" ON evaluation_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_admin')
    )
  );

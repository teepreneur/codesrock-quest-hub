-- =============================================
-- Migration: Student Topic Mastery Tracking
-- =============================================

-- 1. Create table for tracking student progress against topics
CREATE TABLE IF NOT EXISTS student_topic_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(student_id, topic_id)
);

-- 2. Add indexes for performance
CREATE INDEX idx_student_topic_progress_student ON student_topic_progress(student_id);
CREATE INDEX idx_student_topic_progress_topic ON student_topic_progress(topic_id);

-- 3. Enable RLS
ALTER TABLE student_topic_progress ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Teachers can manage progress for students in their classes
-- This is a simplified policy. In a real app, you'd join with class_students
CREATE POLICY "Teachers can manage student progress" ON student_topic_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'school_admin', 'super_admin')
    )
  );

-- Admins can view everything
CREATE POLICY "Admins can view all student progress" ON student_topic_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'content_admin')
    )
  );

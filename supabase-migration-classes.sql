-- =============================================
-- Migration: Add Classes, Class_Students, and Student Role
-- =============================================

-- 1. Update profiles role constraint
-- First, drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with 'student'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('teacher', 'school_admin', 'content_admin', 'super_admin', 'student'));

-- 2. Create Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Class Students junction table
CREATE TABLE IF NOT EXISTS class_students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);

-- 5. Add updated_at trigger for classes
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- 7. Add basic RLS Policies (Simplified for now)
-- Teachers can manage their own classes
CREATE POLICY "Teachers can manage their own classes" ON classes
  FOR ALL USING (auth.uid() = teacher_id);

-- Students can see their own class memberships
CREATE POLICY "Students can see their own classes" ON class_students
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can manage students in their classes
CREATE POLICY "Teachers can manage their class students" ON class_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

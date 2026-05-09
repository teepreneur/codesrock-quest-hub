-- Migration: Add Certificates Table and Automation
-- Description: Supports tracking and automatic generation of completion certificates.

-- 1. Create Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'course' CHECK (type IN ('course', 'level', 'program')),
  certificate_id TEXT UNIQUE NOT NULL, -- Human-readable unique ID (e.g., CR-2024-XXXX)
  date_earned TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);

-- 3. Trigger Function to automatically generate certificate on course completion
CREATE OR REPLACE FUNCTION generate_course_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_course_title TEXT;
  v_cert_id TEXT;
BEGIN
  -- Only proceed if course was just marked completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    
    -- Get course title
    SELECT title INTO v_course_title FROM courses WHERE id = NEW.course_id;
    
    -- Generate unique human-readable ID
    v_cert_id := 'CR-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTR(MD5(NEW.id::text), 1, 6));

    -- Insert certificate if not already exists
    INSERT INTO certificates (user_id, course_id, title, certificate_id, type)
    VALUES (NEW.user_id, NEW.course_id, v_course_title, v_cert_id, 'course')
    ON CONFLICT (certificate_id) DO NOTHING;

    -- Log activity
    INSERT INTO activities (user_id, type, description)
    VALUES (NEW.user_id, 'badge_earned', 'Earned Certificate: ' || v_course_title);
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger to video_progress
DROP TRIGGER IF EXISTS tr_generate_certificate ON video_progress;
CREATE TRIGGER tr_generate_certificate
  AFTER UPDATE ON video_progress
  FOR EACH ROW
  EXECUTE FUNCTION generate_course_certificate();

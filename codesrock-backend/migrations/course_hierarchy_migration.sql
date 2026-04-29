-- ============================================================
-- CodesRock Course Hierarchy Migration
-- Course → Topic → Video restructure
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create 'topics' table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(course_id, order_index);

-- 2. Create 'videos' table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail TEXT,
  duration INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 25,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_topic_id ON videos(topic_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(topic_id, order_index);

-- 3. Add video_id column to video_progress for per-video tracking
ALTER TABLE video_progress ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES videos(id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON video_progress(video_id);

-- 4. Migrate existing courses into the new hierarchy
-- Each existing course with a video_url becomes:
--   Course (unchanged) → 1 auto-generated Topic → 1 auto-generated Video

-- Step 4a: Create a default topic for each existing active course
INSERT INTO topics (course_id, title, description, order_index)
SELECT id, title, description, 0
FROM courses
WHERE video_url IS NOT NULL
  AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM topics t WHERE t.course_id = courses.id
  );

-- Step 4b: Create a video under each auto-generated topic
INSERT INTO videos (topic_id, course_id, title, description, video_url, thumbnail, duration, xp_reward, order_index)
SELECT t.id, c.id, c.title, c.description, c.video_url, c.thumbnail, c.duration, c.xp_reward, 0
FROM courses c
JOIN topics t ON t.course_id = c.id
WHERE c.video_url IS NOT NULL
  AND c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM videos v WHERE v.topic_id = t.id
  );

-- Step 4c: Link existing video_progress records to the new video entries
UPDATE video_progress vp
SET video_id = v.id
FROM videos v
WHERE v.course_id = vp.course_id
  AND vp.video_id IS NULL;

-- 5. Verify migration
SELECT 'courses' as entity, count(*) as count FROM courses WHERE is_active = true
UNION ALL
SELECT 'topics', count(*) FROM topics WHERE is_active = true
UNION ALL
SELECT 'videos', count(*) FROM videos WHERE is_active = true
UNION ALL
SELECT 'video_progress with video_id', count(*) FROM video_progress WHERE video_id IS NOT NULL;

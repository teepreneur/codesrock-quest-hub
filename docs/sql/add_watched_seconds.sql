-- =============================================
-- ADD: watched_seconds to video_progress
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_progress' AND column_name = 'watched_seconds') THEN
        ALTER TABLE video_progress ADD COLUMN watched_seconds INTEGER DEFAULT 0;
    END IF;
END $$;

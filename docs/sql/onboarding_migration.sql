-- Teacher Onboarding & Activation Migration
-- Adds activation tracking and onboarding state to user_progress

-- 1. Add activation and onboarding status columns to user_progress if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_progress' AND COLUMN_NAME = 'is_activated') THEN
        ALTER TABLE user_progress ADD COLUMN is_activated BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_progress' AND COLUMN_NAME = 'onboarding_status') THEN
        ALTER TABLE user_progress ADD COLUMN onboarding_status JSONB DEFAULT '{"phase": 1, "step": 0, "completed": false}'::jsonb;
    END IF;
END $$;

-- 2. Create the "Pioneer Teacher" badge if it doesn't exist
INSERT INTO badges (name, description, icon, category, points)
SELECT 'Pioneer Teacher', 'Awarded for completing the teacher onboarding and passing the first module challenge.', '🏅', 'Special', 100
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Pioneer Teacher');

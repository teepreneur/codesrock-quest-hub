-- =============================================================================
-- Activity book progress tracking (October 2026)
--
-- Teachers log each CodesRock lesson: which activities from the activity book
-- were covered, who attended, and how each child did on each activity
-- (1 = Not yet, 2 = With help, 3 = On their own). Mat and robot missions are
-- rated twice: 'practical' (with the mats / robot mouse) and 'book' (writing
-- the code in the activity book).
--
-- Children are a teacher-managed roster (`learners`) with no login accounts.
-- Existing student profiles enrolled in classes are copied into it.
--
-- All access goes through the API (service_role). RLS is enabled with no
-- client policies, so the anon key cannot read or write these tables.
-- Safe to re-run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Curriculum: books -> units -> activities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES public.curricula(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('song', 'story_mission', 'unplugged', 'robot', 'platform')),
  book_pages TEXT,
  summary TEXT,
  UNIQUE (curriculum_id, position)
);

CREATE TABLE IF NOT EXISTS public.curriculum_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.curriculum_units(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  book_page INTEGER,
  skills TEXT[] NOT NULL DEFAULT '{}'
    CHECK (skills <@ ARRAY['vocabulary','directions','sequencing','navigation','debugging','collaboration']::text[]),
  modes TEXT[] NOT NULL DEFAULT ARRAY['book']::text[]
    CHECK (cardinality(modes) > 0 AND modes <@ ARRAY['practical','book']::text[]),
  UNIQUE (unit_id, position)
);

-- -----------------------------------------------------------------------------
-- 2. Roster: learners (no login) and their classes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  legacy_profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, learner_id)
);
CREATE INDEX IF NOT EXISTS idx_class_learners_learner ON public.class_learners(learner_id);

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS curriculum_id UUID REFERENCES public.curricula(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 3. Lessons and results
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_class_date ON public.lesson_sessions(class_id, session_date DESC);

CREATE TABLE IF NOT EXISTS public.lesson_session_activities (
  session_id UUID NOT NULL REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.curriculum_activities(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, activity_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_attendance (
  session_id UUID NOT NULL REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  PRIMARY KEY (session_id, learner_id)
);

CREATE TABLE IF NOT EXISTS public.learner_activity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.curriculum_activities(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('practical', 'book')),
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
  UNIQUE (session_id, learner_id, activity_id, mode)
);
CREATE INDEX IF NOT EXISTS idx_learner_results_learner ON public.learner_activity_results(learner_id);

-- -----------------------------------------------------------------------------
-- 4. RLS: API only
-- -----------------------------------------------------------------------------
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_activity_results ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. Seed: CodesRock 1 Activity Book (book page numbers as printed)
-- -----------------------------------------------------------------------------
INSERT INTO public.curricula (slug, title, description)
VALUES ('codesrock-1-activity-book', 'CodesRock 1 Activity Book',
        'Songs, story missions, unplugged mat missions, robot mouse and City Navigator.')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO public.curriculum_units (curriculum_id, position, title, unit_type, book_pages, summary)
SELECT c.id, u.position, u.title, u.unit_type, u.book_pages, u.summary
FROM public.curricula c,
  (VALUES
    (1, 'Algorithm Song', 'song', '1-12', 'Words: algorithm, step by step, move, turn, command, solving problems.'),
    (2, 'Move and Groove', 'song', '13-20', 'Words: right, left, forward, backward.'),
    (3, 'Turn Left Turn Right', 'song', '21-26', 'Words: turn right, turn left.'),
    (4, 'Direction Commands', 'song', '27-44', 'Commands: move forward, move backward, turn right, turn left.'),
    (5, 'Kojo''s Toy Adventure', 'story_mission', '45-56', 'Write the direction commands that lead Kojo to each toy on the grid.'),
    (6, 'Kwame''s LEGO Rescue Mission', 'story_mission', '57-64', 'Help Kwame find the missing robot parts with direction commands.'),
    (7, 'Ama''s Grocery Hunt', 'story_mission', '65-74', 'Guide Ama through the store to each item on her shopping list.'),
    (8, 'Let''s Move Together', 'song', '75-78', 'Words: move forward, move backward, turn right, turn left, pick, jump over.'),
    (9, '"Let''s go code" activity set', 'unplugged', '79-100', 'Pairs lay out the foam maze mats; one child programs, the other follows. Later missions add blockades, springs and gears.'),
    (10, 'Debugging', 'song', '101-116', 'Words: sequence, blocks, wrong, right, pattern, debug, bug, code, fix, order, debugging, errors.'),
    (11, 'Code a real robot', 'robot', '117-138', 'Program the robot mouse on the grid to reach the cheese, avoiding walls.'),
    (12, 'City Navigator', 'platform', '139-143', 'Use 2D commands (walk right, walk left, slide, jump up) to collect the balls in order.')
  ) AS u(position, title, unit_type, book_pages, summary)
WHERE c.slug = 'codesrock-1-activity-book'
ON CONFLICT (curriculum_id, position) DO UPDATE
  SET title = EXCLUDED.title, unit_type = EXCLUDED.unit_type,
      book_pages = EXCLUDED.book_pages, summary = EXCLUDED.summary;

INSERT INTO public.curriculum_activities (unit_id, position, title, book_page, skills, modes)
SELECT un.id, a.position, a.title, a.book_page, a.skills, a.modes
FROM (VALUES
  -- 1. Algorithm Song
    (1, 1, 'Sing and act out the song', 1, ARRAY['vocabulary','sequencing']::text[], ARRAY['practical']::text[]),
    (1, 2, 'Word tracing', 4, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (1, 3, 'Write the words after tracing', 6, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (1, 4, 'Fill in the missing letters', 8, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (1, 5, 'Unscramble the words', 10, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
  -- 2. Move and Groove
    (2, 1, 'Sing and act out the song', 13, ARRAY['vocabulary','directions']::text[], ARRAY['practical']::text[]),
    (2, 2, 'Word tracing', 16, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (2, 3, 'Write the words after tracing', 17, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (2, 4, 'Fill in the missing letters', 18, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (2, 5, 'Unscramble the words', 19, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
  -- 3. Turn Left Turn Right
    (3, 1, 'Sing and act out the song', 21, ARRAY['vocabulary','directions']::text[], ARRAY['practical']::text[]),
    (3, 2, 'Trace and write the words', 24, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (3, 3, 'Fill in the missing letters', 25, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (3, 4, 'Unscramble the words', 25, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
  -- 4. Direction Commands
    (4, 1, 'Sing and act out the song', 27, ARRAY['vocabulary','directions']::text[], ARRAY['practical']::text[]),
    (4, 2, 'Try the commands on your own', 32, ARRAY['directions']::text[], ARRAY['practical']::text[]),
    (4, 3, 'Picture match', 33, ARRAY['directions']::text[], ARRAY['book']::text[]),
    (4, 4, 'Word match', 34, ARRAY['directions','vocabulary']::text[], ARRAY['book']::text[]),
    (4, 5, 'Word tracing', 35, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (4, 6, 'Write the commands after tracing', 36, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (4, 7, 'Fill in the missing letters', 37, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (4, 8, 'Unscramble the words', 38, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (4, 9, 'Trace the command arrows', 39, ARRAY['directions']::text[], ARRAY['book']::text[]),
    (4, 10, 'Colour the command arrows', 41, ARRAY['directions']::text[], ARRAY['book']::text[]),
    (4, 11, 'Draw the commands', 43, ARRAY['directions']::text[], ARRAY['book']::text[]),
  -- 5. Kojo's Toy Adventure
    (5, 1, 'Mission 1: find the ball', 47, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 2, 'Mission 2: find the tiger', 48, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 3, 'Mission 3: find the car', 49, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 4, 'Mission 4: find the teddy bear', 50, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 5, 'Mission 5: find the robot', 51, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 6, 'Mission 6: find the boat', 52, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 7, 'Mission 7: find the green army man', 53, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 8, 'Mission 8: find the horse', 54, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 9, 'Mission 9: find the camera', 55, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (5, 10, 'Mission 10: find the duck', 56, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
  -- 6. Kwame's LEGO Rescue Mission
    (6, 1, 'Mission 1: find the robot''s head', 59, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (6, 2, 'Mission 2: find the robot''s body', 60, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (6, 3, 'Mission 3: find the robot''s left arm', 61, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (6, 4, 'Mission 4: find the robot''s right arm', 62, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (6, 5, 'Mission 5: find the robot''s legs', 63, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
  -- 7. Ama's Grocery Hunt
    (7, 1, 'Mission 1: find the flour', 67, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 2, 'Mission 2: find the eggs', 68, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 3, 'Mission 3: find the milk', 69, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 4, 'Mission 4: find the bread', 70, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 5, 'Mission 5: find the oil', 71, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 6, 'Mission 6: find the yoghurt', 72, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
    (7, 7, 'Mission 7: find the pasta', 73, ARRAY['directions','sequencing','navigation']::text[], ARRAY['book']::text[]),
  -- 8. Let's Move Together
    (8, 1, 'Sing and act out the song', 75, ARRAY['vocabulary','directions']::text[], ARRAY['practical']::text[]),
  -- 9. "Let's go code" activity set
    (9, 1, '2-mat mission 1', 84, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 2, '3-mat mission 1', 85, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 3, '3-mat mission 2', 85, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 4, '4-mat mission 1', 86, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 5, '4-mat mission 2', 86, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 6, '4-mat mission 3', 86, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 7, '4-mat mission 4', 87, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 8, '4-mat mission 5', 87, ARRAY['sequencing','navigation','collaboration']::text[], ARRAY['practical','book']::text[]),
    (9, 9, '5-mat mission 1', 88, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 10, '5-mat mission 2', 88, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 11, '6-mat mission 1', 89, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 12, '7-mat mission 1', 90, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 13, '7-mat mission 2', 90, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 14, '8-mat mission 1', 91, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 15, '8-mat mission 2', 92, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 16, '8-mat mission 3', 93, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 17, '9-mat mission 1', 94, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 18, '10-mat mission 1', 95, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 19, '10-mat mission 2', 96, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 20, '11-mat mission 1', 97, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 21, '11-mat mission 2', 98, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 22, '12-mat mission 1', 99, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
    (9, 23, '12-mat mission 2', 100, ARRAY['sequencing','navigation','collaboration','debugging']::text[], ARRAY['practical','book']::text[]),
  -- 10. Debugging
    (10, 1, 'Sing and act out the song', 101, ARRAY['vocabulary','debugging']::text[], ARRAY['practical']::text[]),
    (10, 2, 'Word tracing', 104, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (10, 3, 'Write the words after tracing', 107, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (10, 4, 'Fill in the missing letters', 110, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
    (10, 5, 'Unscramble the words', 113, ARRAY['vocabulary']::text[], ARRAY['book']::text[]),
  -- 11. Code a real robot
    (11, 1, 'Robot mission 1', 119, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 2, 'Robot mission 2', 120, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 3, 'Robot mission 3', 121, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 4, 'Robot mission 4', 122, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 5, 'Robot mission 5', 123, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 6, 'Robot mission 6', 124, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 7, 'Robot mission 7', 125, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 8, 'Robot mission 8', 126, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 9, 'Robot mission 9', 127, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 10, 'Robot mission 10', 128, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 11, 'Robot mission 11', 129, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 12, 'Robot mission 12', 130, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 13, 'Robot mission 13', 131, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 14, 'Robot mission 14', 132, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 15, 'Robot mission 15', 133, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 16, 'Robot mission 16', 134, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 17, 'Robot mission 17', 135, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 18, 'Robot mission 18', 136, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 19, 'Robot mission 19', 137, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
    (11, 20, 'Robot mission 20', 138, ARRAY['sequencing','navigation','debugging']::text[], ARRAY['practical','book']::text[]),
  -- 12. City Navigator
    (12, 1, 'Mission 1: cross the floating city', 140, ARRAY['directions','sequencing']::text[], ARRAY['book']::text[]),
    (12, 2, 'Mission 2: cross the desert city', 141, ARRAY['directions','sequencing']::text[], ARRAY['book']::text[]),
    (12, 3, 'Final mission: colour the characters', 142, ARRAY[]::text[], ARRAY['book']::text[])
  ) AS a(unit_position, position, title, book_page, skills, modes)
JOIN public.curriculum_units un ON un.position = a.unit_position
JOIN public.curricula c ON c.id = un.curriculum_id AND c.slug = 'codesrock-1-activity-book'
ON CONFLICT (unit_id, position) DO UPDATE
  SET title = EXCLUDED.title, book_page = EXCLUDED.book_page,
      skills = EXCLUDED.skills, modes = EXCLUDED.modes;

-- Existing classes follow this book
UPDATE public.classes
SET curriculum_id = (SELECT id FROM public.curricula WHERE slug = 'codesrock-1-activity-book')
WHERE curriculum_id IS NULL;

-- -----------------------------------------------------------------------------
-- 6. Copy existing enrolled student profiles into the learner roster
-- -----------------------------------------------------------------------------
INSERT INTO public.learners (school_id, first_name, last_name, legacy_profile_id, created_at)
SELECT DISTINCT ON (p.id) COALESCE(p.school_id, cl.school_id), p.first_name, COALESCE(p.last_name, ''), p.id, p.created_at
FROM public.class_students cs
JOIN public.profiles p ON p.id = cs.student_id
JOIN public.classes cl ON cl.id = cs.class_id
ON CONFLICT (legacy_profile_id) DO NOTHING;

INSERT INTO public.class_learners (class_id, learner_id, enrolled_at)
SELECT cs.class_id, l.id, cs.enrolled_at
FROM public.class_students cs
JOIN public.learners l ON l.legacy_profile_id = cs.student_id
ON CONFLICT (class_id, learner_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Save a lesson atomically (called by the API)
-- payload: { session_id?, class_id, teacher_id, session_date, notes,
--            activity_ids: [uuid], attendance: [{ learner_id, present, note }],
--            results: [{ learner_id, activity_id, mode, level }] }
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_lesson_session(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID := NULLIF(payload->>'session_id', '')::uuid;
BEGIN
  IF v_session_id IS NULL THEN
    INSERT INTO lesson_sessions (class_id, teacher_id, session_date, notes)
    VALUES ((payload->>'class_id')::uuid, (payload->>'teacher_id')::uuid,
            (payload->>'session_date')::date, payload->>'notes')
    RETURNING id INTO v_session_id;
  ELSE
    UPDATE lesson_sessions
    SET session_date = (payload->>'session_date')::date,
        notes = payload->>'notes',
        updated_at = now()
    WHERE id = v_session_id AND class_id = (payload->>'class_id')::uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lesson not found for this class';
    END IF;
    DELETE FROM lesson_session_activities WHERE session_id = v_session_id;
    DELETE FROM lesson_attendance WHERE session_id = v_session_id;
    DELETE FROM learner_activity_results WHERE session_id = v_session_id;
  END IF;

  INSERT INTO lesson_session_activities (session_id, activity_id)
  SELECT v_session_id, value::uuid
  FROM jsonb_array_elements_text(COALESCE(payload->'activity_ids', '[]'::jsonb));

  INSERT INTO lesson_attendance (session_id, learner_id, present, note)
  SELECT v_session_id, (a->>'learner_id')::uuid, COALESCE((a->>'present')::boolean, true), NULLIF(a->>'note', '')
  FROM jsonb_array_elements(COALESCE(payload->'attendance', '[]'::jsonb)) a;

  INSERT INTO learner_activity_results (session_id, learner_id, activity_id, mode, level)
  SELECT v_session_id, (r->>'learner_id')::uuid, (r->>'activity_id')::uuid, r->>'mode', (r->>'level')::smallint
  FROM jsonb_array_elements(COALESCE(payload->'results', '[]'::jsonb)) r;

  RETURN v_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_lesson_session(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_lesson_session(JSONB) TO service_role;

-- -----------------------------------------------------------------------------
-- 8. Admin overview: one row per class, aggregated in the database
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.class_progress_overview(p_school_id UUID DEFAULT NULL)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  school_id UUID,
  school_name TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  learner_count BIGINT,
  lesson_count BIGINT,
  last_lesson_date DATE,
  activities_covered BIGINT,
  activities_total BIGINT,
  avg_level NUMERIC,
  independent_rate NUMERIC,
  practical_avg NUMERIC,
  book_avg NUMERIC,
  attendance_rate NUMERIC
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    c.id, c.name, c.school_id, s.name,
    c.teacher_id, NULLIF(TRIM(COALESCE(t.first_name, '') || ' ' || COALESCE(t.last_name, '')), ''),
    (SELECT count(*) FROM class_learners cl JOIN learners l ON l.id = cl.learner_id AND l.is_active WHERE cl.class_id = c.id),
    (SELECT count(*) FROM lesson_sessions ls WHERE ls.class_id = c.id),
    (SELECT max(ls.session_date) FROM lesson_sessions ls WHERE ls.class_id = c.id),
    (SELECT count(DISTINCT lsa.activity_id) FROM lesson_session_activities lsa
       JOIN lesson_sessions ls ON ls.id = lsa.session_id WHERE ls.class_id = c.id),
    (SELECT count(*) FROM curriculum_activities ca JOIN curriculum_units cu ON cu.id = ca.unit_id
       WHERE cu.curriculum_id = c.curriculum_id),
    r.avg_level, r.independent_rate, r.practical_avg, r.book_avg,
    (SELECT round(avg(CASE WHEN la.present THEN 1 ELSE 0 END)::numeric, 3)
       FROM lesson_attendance la JOIN lesson_sessions ls ON ls.id = la.session_id WHERE ls.class_id = c.id)
  FROM classes c
  LEFT JOIN schools s ON s.id = c.school_id
  LEFT JOIN profiles t ON t.id = c.teacher_id
  LEFT JOIN LATERAL (
    SELECT
      round(avg(lr.level)::numeric, 2) AS avg_level,
      round(avg(CASE WHEN lr.level = 3 THEN 1 ELSE 0 END)::numeric, 3) AS independent_rate,
      round(avg(lr.level) FILTER (WHERE lr.mode = 'practical')::numeric, 2) AS practical_avg,
      round(avg(lr.level) FILTER (WHERE lr.mode = 'book')::numeric, 2) AS book_avg
    FROM learner_activity_results lr
    JOIN lesson_sessions ls ON ls.id = lr.session_id
    WHERE ls.class_id = c.id
  ) r ON true
  WHERE p_school_id IS NULL OR c.school_id = p_school_id
  ORDER BY s.name NULLS LAST, c.name;
$$;

REVOKE EXECUTE ON FUNCTION public.class_progress_overview(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.class_progress_overview(UUID) TO service_role;

COMMIT;

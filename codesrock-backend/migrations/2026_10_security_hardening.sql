-- =============================================================================
-- Security hardening (October 2026)
--
-- The app never talks to Supabase from the browser: every read and write goes
-- through the Express API using the service_role key, which bypasses RLS.
-- These changes therefore only affect direct access with the anon key or a
-- user's own Supabase JWT, and close the holes reported by the Supabase
-- security advisor:
--   * RLS was disabled on public.profiles (anyone could read/edit any profile,
--     including `role`)
--   * topics/videos allowed anyone to insert, update and delete
--   * users could write their own XP, badges, quiz results, video completion
--     (which issues certificates) and session attendance directly
--   * correct quiz answers were readable by every signed-in user
--   * SECURITY DEFINER functions (award_xp, complete_course, ...) were callable
--     by anon/authenticated through /rest/v1/rpc
--   * functions had a mutable search_path
--
-- Safe to re-run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. profiles: enable RLS, keep only "read own profile" for clients
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Self-referencing policy (recursive once RLS is on) and the policy that let
-- users change their own role.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- Kept: "Users can view own profile", "Service role has full access"

-- -----------------------------------------------------------------------------
-- 2. Content tables: read-only for signed-in users
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all select on topics" ON public.topics;
DROP POLICY IF EXISTS "Allow all insert on topics" ON public.topics;
DROP POLICY IF EXISTS "Allow all update on topics" ON public.topics;
DROP POLICY IF EXISTS "Allow all delete on topics" ON public.topics;
DROP POLICY IF EXISTS "Authenticated can read topics" ON public.topics;
CREATE POLICY "Authenticated can read topics" ON public.topics
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all select on videos" ON public.videos;
DROP POLICY IF EXISTS "Allow all insert on videos" ON public.videos;
DROP POLICY IF EXISTS "Allow all update on videos" ON public.videos;
DROP POLICY IF EXISTS "Allow all delete on videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated can read videos" ON public.videos;
CREATE POLICY "Authenticated can read videos" ON public.videos
  FOR SELECT TO authenticated USING (true);

-- Questions include correct answers; only the API (service_role) reads them.
DROP POLICY IF EXISTS "Users can view questions" ON public.evaluation_questions;

-- -----------------------------------------------------------------------------
-- 3. Progress / reward tables: clients may read their own rows, never write
--    (writes happen in the API, which grades and awards server-side)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

DROP POLICY IF EXISTS "Users can create their own progress" ON public.evaluation_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.evaluation_progress;

DROP POLICY IF EXISTS "Users can upsert own video progress" ON public.video_progress;
DROP POLICY IF EXISTS "Users can update own video progress" ON public.video_progress;

DROP POLICY IF EXISTS "System can create user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Public can view user badges" ON public.user_badges;

DROP POLICY IF EXISTS "Users can create own activities" ON public.activities;
-- Activities also hold admin audit entries (IP address, user agent)
DROP POLICY IF EXISTS "Public can view recent activities" ON public.activities;

DROP POLICY IF EXISTS "Users can create downloads" ON public.resource_downloads;

DROP POLICY IF EXISTS "Users can create registrations" ON public.session_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.session_registrations;

-- -----------------------------------------------------------------------------
-- 4. Functions: fixed search_path, and SECURITY DEFINER functions callable by
--    the API only. Trigger functions keep firing: EXECUTE is only checked
--    when a trigger is created, not when it fires.
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.award_xp(uuid, integer, text, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.award_xp(uuid, integer, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_level(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_course(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.download_resource(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fix_missing_evaluation_xp(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_course_certificate() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_school_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_username(text, text, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_analytics_overview() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_leaderboard(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_streak(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.award_xp(uuid, integer, text, text, jsonb)',
    'public.award_xp(uuid, integer, text, text)',
    'public.complete_course(uuid, uuid)',
    'public.download_resource(uuid, uuid)',
    'public.fix_missing_evaluation_xp(uuid, uuid)',
    'public.generate_course_certificate()',
    'public.get_analytics_overview()',
    'public.get_leaderboard(integer)',
    'public.handle_new_user()',
    'public.update_streak(uuid)'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

COMMIT;

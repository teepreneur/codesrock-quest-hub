# Database migrations

New schema changes go in this folder, named `YYYY_MM_short_description.sql`,
and are applied to the production Supabase project (`CodesRock_Portal-database`)
in name order. Each file should be safe to re-run.

Older SQL lives in `docs/sql/` and in the files here without a date prefix.
Those were applied by hand during the MongoDB → Supabase migration and are
kept for reference only. The live database is the source of truth, so check it
before re-running any of them.

## Important: how the API talks to Supabase

The Express API uses the **service_role** key, which bypasses Row Level
Security. RLS policies only protect direct access with the anon key or a
user's JWT, which the frontend never uses. Keep client-facing policies
read-only (own rows) and do all writes in the API.

`2026_10_security_hardening.sql` depends on the backend fix that stopped user
sessions leaking into the shared service client (`src/config/supabase.ts`).
Deploy that backend version before applying it.

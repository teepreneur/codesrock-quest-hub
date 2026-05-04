# Supabase Setup Instructions

## Prerequisites

You already have your Supabase project created:
- **Project Name**: CodesRock_Portal-database
- **Project URL**: https://qordfzghwjkpwsfehjjz.supabase.co

## Step 1: Run SQL Scripts in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: CodesRock_Portal-database

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Schema Script**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - ✅ Wait for confirmation (should see "Success")

4. **Run RLS Policies Script**
   - Create another new query
   - Copy the entire contents of `supabase-rls-policies.sql`
   - Paste and run
   - ✅ Wait for confirmation

5. **Run Functions Script**
   - Create another new query
   - Copy the entire contents of `supabase-functions.sql`
   - Paste and run
   - ✅ Wait for confirmation

## Step 2: Verify Tables

1. Go to "Table Editor" in the Supabase dashboard
2. You should see these tables:
   - profiles
   - schools
   - user_progress
   - badges
   - user_badges
   - courses
   - video_progress
   - resources
   - resource_downloads
   - activities
   - training_sessions
   - session_registrations

## Step 3: Configure Authentication

1. Go to "Authentication" > "Providers"
2. Ensure "Email" provider is enabled
3. Under "Email Auth" settings:
   - ✅ Enable email confirmations (or disable for testing)
   - Set redirect URLs if needed

## Your API Keys

Already configured:

```env
# Supabase URL
SUPABASE_URL=https://qordfzghwjkpwsfehjjz.supabase.co

# Frontend (Public/Anon Key)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcmRmemdod2prcHdzZmVoamp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NjEwNTYsImV4cCI6MjA3OTUzNzA1Nn0.-lusBkcA5fUhkvbao_5A5UrdXTiHK6yC4hRf3MaoZ7Y

# Backend (Service Role Key)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcmRmemdod2prcHdzZmVoamp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NiwiZXhwIjoyMDc5NTM3MDU2fQ.HbpAMeJXWciQvyWLMZ6jamv8NiMES4ETYy1sBGKFtAE
```

## Next Steps

After running all SQL scripts successfully:
1. ✅ Install Supabase packages in backend and frontend
2. ✅ Update environment variables
3. ✅ Migrate backend code to use Supabase
4. ✅ Migrate frontend code to use Supabase
5. ✅ Seed initial data
6. ✅ Test the migration

## Troubleshooting

If you encounter errors:
- Make sure to run scripts in order (schema → RLS → functions)
- Check for syntax errors in the SQL editor
- Verify all extensions are enabled (uuid-ossp should be enabled by default)
- Check the Supabase logs in the dashboard

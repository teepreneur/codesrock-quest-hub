# Remaining Backend Controllers - Simplified Migration Guide

## Strategy: Use Service Role Client for Complex Queries

The remaining controllers (Dashboard, Session, Evaluation, Admin) have complex aggregations that are easier to handle with the service role client that bypasses RLS.

## Pattern for Remaining Controllers

### Import Pattern
```typescript
import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
```

### Query Patterns for Each Controller

## Dashboard Controller

### getUserDashboard
```typescript
// Get data in parallel from multiple tables
const [progress, activities, courseProgress, sessions] = await Promise.all([
  supabase.from('user_progress').select('*').eq('user_id', userId).single(),
  supabase.from('activities').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(10),
  supabase.from('video_progress').select('*, courses(*)').eq('user_id', userId).order('last_watched_at', { ascending: false }).limit(5),
  supabase.from('session_registrations').select('*, training_sessions(*)').eq('user_id', userId).limit(5),
]);
```

### getAdminStats
```typescript
// Use count queries
const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true);
```

## Session Controller

### getAllSessions
```typescript
let query = supabase.from('training_sessions').select('*').eq('is_active', true);
if (upcoming === 'true') query = query.gte('start_time', new Date().toISOString());
const { data: sessions } = await query.order('start_time');
```

### registerForSession
```typescript
// Check capacity
const { data: session } = await supabase.from('training_sessions').select('*').eq('id', sessionId).single();
if (session.current_participants >= session.max_participants) {
  return res.status(400).json({ message: 'Session is full' });
}

// Create registration
await supabase.from('session_registrations').insert({
  user_id: userId,
  session_id: sessionId,
  registered_at: new Date().toISOString(),
});

// Increment participant count
await supabase.from('training_sessions')
  .update({ current_participants: session.current_participants + 1 })
  .eq('id', sessionId);
```

## Evaluation Controller

### All Evaluation Functions
Replace MongoDB models with corresponding Supabase tables:
- `Evaluation` → `evaluations` table
- `UserEvaluation` → `user_evaluations` table
- `Certificate` → `certificates` table

Key changes:
- `status` field remains the same
- `completedItems` stored as JSONB array
- Certificate generation: Insert into `certificates` table with unique number

## Admin Controllers

### Admin Analytics
```typescript
// Use aggregate queries
const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

// For trends, query with date filters
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { count: newUsers } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', thirtyDaysAgo.toISOString());
```

### Admin Users
```typescript
// Pagination with filters
let query = supabase.from('profiles').select('*', { count: 'exact' });
if (role) query = query.eq('role', role);
if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

const { data: users, count } = await query
  .order('created_at', { ascending: false })
  .range(skip, skip + limit - 1);
```

### Admin Content
```typescript
// CRUD operations
// Create
await supabase.from('courses').insert(courseData);

// Update
await supabase.from('courses').update(courseData).eq('id', courseId);

// Delete (soft delete)
await supabase.from('courses').update({ is_active: false }).eq('id', courseId);

// Get with stats
const { data: courses } = await supabase
  .from('courses')
  .select('*, video_progress(count)')
  .order('created_at', { ascending: false });
```

## Quick Implementation Notes

### For Dashboard Controller:
- Aggregate data from multiple tables
- Format response to match existing API
- Handle null values gracefully

### For Session Controller:
- Manage capacity checks
- Update participant counts
- Track attendance with timestamps

### For Evaluation Controller:
- Handle JSONB fields (completedItems)
- Generate unique certificate numbers
- Calculate scores based on points

### For Admin Controllers:
- Implement pagination
- Add search filters
- Handle RLS with service role for admin queries

## Database Helper Functions to Add

You may want to add these helper functions to `supabase-functions.sql`:

```sql
-- Increment function for atomic updates
CREATE OR REPLACE FUNCTION increment_column(
  table_name text,
  column_name text,
  row_id uuid,
  amount int DEFAULT 1
) RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING amount, row_id;
END;
$$ LANGUAGE plpgsql;
```

## Next Step: Frontend Migration

Once backend controllers are complete, frontend migration requires:
1. Install `@supabase/supabase-js`
2. Create `src/config/supabase.ts` with anon key
3. Replace API calls with direct Supabase queries
4. Use Supabase auth hooks for session management

The frontend will be simpler since it uses the anon key and relies on RLS policies for security.

# CodesRock Portal - MongoDB to Supabase Migration Progress

## Migration Status: 🟡 In Progress (Critical Backend Complete)

Last Updated: November 24, 2024

---

## ✅ Completed Tasks

### 1. Database Schema Setup
- ✅ Created comprehensive Supabase schema (`supabase-schema.sql`)
  - All tables defined with proper relationships
  - Indexes for performance optimization
  - Automatic triggers for `updated_at` fields
  - Auto-creation of profiles and user_progress on user registration

- ✅ Row Level Security (RLS) policies (`supabase-rls-policies.sql`)
  - User data privacy protection
  - Role-based access control
  - Public read access for appropriate data (leaderboard, courses, resources)

- ✅ PostgreSQL Functions (`supabase-functions.sql`)
  - `award_xp()` - Award XP and handle level-ups
  - `update_streak()` - Manage daily streaks
  - `complete_course()` - Mark course completion and award XP
  - `download_resource()` - Track downloads and award XP
  - `get_analytics_overview()` - Get platform statistics
  - `get_leaderboard()` - Get top users

### 2. Backend Migration
- ✅ Installed Supabase packages
- ✅ Created Supabase configuration (`src/config/supabase.ts`)
  - TypeScript type definitions for all tables
  - Function return types
  - Service role client setup

- ✅ Updated environment variables (`.env`)
  - Added Supabase URL and keys
  - Commented out MongoDB connection

- ✅ Updated server startup (`src/server.ts`)
  - Removed MongoDB connection
  - Added Supabase connection verification

- ✅ Migrated Authentication Middleware
  - `src/middleware/auth.ts` - Supabase token verification
  - `src/middleware/roleAuth.ts` - Role-based authorization
  - Audit logging to activities table

- ✅ Migrated Auth Controller (`src/controllers/authController.ts`)
  - Register with Supabase Auth
  - Login with password and profile fetching
  - Token refresh
  - Logout
  - Get current user with progress and badges
  - Update profile
  - Change password
  - Forgot password
  - Reset password

- ✅ Created Seed Script (`src/scripts/seed-supabase.ts`)
  - Admin account creation
  - Sample teacher accounts
  - Badges (12 badges)
  - Courses (21 courses across 4 categories)
  - Resources (8 resources)

---

## 🔄 Remaining Tasks

### 3. Backend Controllers (Still Using MongoDB)

The following controllers need to be migrated to use Supabase:

#### High Priority
- ⏳ `src/controllers/gamificationController.ts`
  - Get user progress
  - Get leaderboard
  - Get user badges
  - Award badge
  - Get activities/feed

- ⏳ `src/controllers/courseController.ts`
  - Get all courses
  - Get course by ID
  - Complete course (uses award_xp function)
  - Get user's course progress
  - Admin: Create/Update/Delete courses

- ⏳ `src/controllers/resourceController.ts`
  - Get all resources
  - Download resource (uses download_resource function)
  - Get user's downloads
  - Admin: Create/Update/Delete resources

#### Medium Priority
- ⏳ `src/controllers/dashboardController.ts`
  - Get dashboard statistics
  - Get recent activities
  - Get user analytics

- ⏳ `src/controllers/sessionController.ts`
  - Training sessions CRUD
  - Register for session
  - Mark attendance

- ⏳ `src/controllers/evaluationController.ts`
  - Assessment/evaluation features

#### Low Priority
- ⏳ `src/controllers/admin/` directory
  - User management
  - Content management
  - Analytics endpoints

### 4. Frontend Migration

All frontend code still uses MongoDB API responses. Need to:

- ⏳ Install Supabase packages in frontend
- ⏳ Create Supabase configuration
- ⏳ Update `.env` files
- ⏳ Migrate auth services
- ⏳ Migrate API services
- ⏳ Update auth context
- ⏳ Add real-time features (optional)

---

## 📋 Step-by-Step Guide to Complete Migration

### Step 1: Run SQL Scripts in Supabase Dashboard

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: CodesRock_Portal-database
3. Open SQL Editor

4. **Run Schema Script:**
   - Copy entire content of `supabase-schema.sql`
   - Paste and execute
   - ✅ Verify: All tables should appear in Table Editor

5. **Run RLS Policies:**
   - Copy entire content of `supabase-rls-policies.sql`
   - Paste and execute
   - ✅ Verify: Policies appear in each table's RLS settings

6. **Run Functions:**
   - Copy entire content of `supabase-functions.sql`
   - Paste and execute
   - ✅ Verify: Functions appear in Database > Functions

### Step 2: Disable Email Confirmation (For Testing)

1. Go to Authentication > Providers > Email
2. Disable "Confirm email" toggle
3. Save changes

### Step 3: Seed the Database

```bash
cd codesrock-backend
npm run seed:supabase
```

This creates:
- 1 Super Admin: `admin@codesrock.org` / `Admin2024!CodesRock`
- 3 Teachers with varying XP levels
- 12 Badges
- 21 Courses
- 8 Resources

### Step 4: Test Authentication

You can test with Postman or the frontend:

**Register New User:**
```http
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "email": "test@codesrock.org",
  "password": "Test2024!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Login:**
```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@codesrock.org",
  "password": "Admin2024!CodesRock"
}
```

**Get Current User:**
```http
GET http://localhost:5001/api/auth/me
Authorization: Bearer <access_token>
```

### Step 5: Migrate Remaining Controllers

For each controller, follow this pattern:

1. Replace MongoDB model imports with Supabase client
2. Replace Mongoose queries with Supabase queries
3. Update field names (MongoDB uses camelCase, Supabase uses snake_case)
4. Update ID references (MongoDB uses `_id`, Supabase uses `id`)
5. Test the endpoint

**Example transformation:**

```typescript
// OLD (MongoDB)
const user = await User.findById(userId);

// NEW (Supabase)
const { data: user, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## 🔍 Key Differences: MongoDB vs Supabase

### Authentication
- **MongoDB**: Custom JWT tokens, manual password hashing
- **Supabase**: Built-in auth system, automatic token management

### Queries
- **MongoDB**: Mongoose methods (findOne, create, updateOne, etc.)
- **Supabase**: SQL-like queries (select, insert, update, delete)

### Field Names
- **MongoDB**: camelCase (firstName, lastName, createdAt)
- **Supabase**: snake_case (first_name, last_name, created_at)

### Relationships
- **MongoDB**: Manual population with .populate()
- **Supabase**: SQL joins with nested select syntax

### Real-time
- **MongoDB**: Requires manual Socket.io setup
- **Supabase**: Built-in real-time subscriptions

---

## 📊 Migration Checklist

### Backend
- [x] Database schema created
- [x] RLS policies configured
- [x] PostgreSQL functions created
- [x] Supabase client configured
- [x] Environment variables updated
- [x] Auth middleware migrated
- [x] Auth controller migrated
- [x] Seed script created
- [ ] Gamification controller migrated
- [ ] Course controller migrated
- [ ] Resource controller migrated
- [ ] Dashboard controller migrated
- [ ] Session controller migrated
- [ ] Evaluation controller migrated
- [ ] Admin controllers migrated

### Frontend
- [ ] Supabase packages installed
- [ ] Supabase client configured
- [ ] Environment variables updated
- [ ] Auth service migrated
- [ ] API services migrated
- [ ] Auth context updated
- [ ] Real-time features added (optional)

### Testing
- [ ] Authentication flow tested
- [ ] User registration tested
- [ ] Login tested
- [ ] Profile updates tested
- [ ] Course completion tested
- [ ] Resource downloads tested
- [ ] Admin functions tested
- [ ] Real-time features tested (if implemented)

---

## 🚀 Next Steps (Priority Order)

1. **Run SQL scripts in Supabase** (5 minutes)
2. **Seed the database** (1 minute)
3. **Test authentication** (5 minutes)
4. **Migrate course controller** (30 minutes) - Most used feature
5. **Migrate gamification controller** (30 minutes) - Core engagement feature
6. **Migrate resource controller** (20 minutes)
7. **Update frontend** (2-3 hours)
8. **Test end-to-end** (30 minutes)
9. **Deploy** (15 minutes)

---

## 🛟 Support & Troubleshooting

### Common Issues

**"User not found" after registration:**
- Check if the trigger `on_auth_user_created` is enabled
- Verify RLS policies allow profile creation

**"Invalid token" errors:**
- Make sure you're using the correct Supabase keys
- Check if token is properly passed in Authorization header

**Cannot query tables:**
- Verify RLS policies are set correctly
- Check if service key is being used for admin operations

### Useful Supabase Queries

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- View all profiles
SELECT * FROM profiles;

-- View user progress
SELECT p.email, up.*
FROM user_progress up
JOIN profiles p ON p.id = up.user_id;

-- Test award_xp function
SELECT * FROM award_xp(
  '<user_id>'::uuid,
  100,
  'test',
  'Testing XP award'
);
```

---

## 📞 Contact

For questions about this migration:
- Check Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---

**Migration started:** November 24, 2024
**Expected completion:** Based on remaining work, approximately 4-6 hours of focused development time.

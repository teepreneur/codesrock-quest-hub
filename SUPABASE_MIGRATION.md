# Supabase Migration - Direct Cutover Guide

## ✅ Pre-Migration Checklist

- [ ] Create Supabase account at https://supabase.com
- [ ] Create project "codesrock-portal" (Europe - London region)
- [ ] Save database password securely
- [ ] Get Project URL, anon key, and service_role key from Settings > API
- [ ] Backup current MongoDB data (if needed)

---

## 📋 Migration Steps

### Step 1: Create Supabase Project (YOU DO THIS)

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: codesrock-portal
   - **Database Password**: (generate strong password - SAVE THIS!)
   - **Region**: Europe (London)
   - **Pricing Plan**: Free
4. Wait 2 minutes for project to initialize

### Step 2: Get Credentials (YOU DO THIS)

Once project is ready:
1. Go to **Settings** > **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role secret: eyJhbGc...
   ```
3. Go to **Settings** > **Database**
4. Copy connection string (we'll need this for migrations)

### Step 3: Run Database Schema (I'LL CREATE THE SQL FILE)

Once you have the project ready, we'll run a single SQL file in the Supabase SQL Editor that will create:
- All tables
- Indexes
- Row Level Security policies
- PostgreSQL functions for XP awards, streaks, etc.
- Initial seed data

### Step 4: Update Backend Code (I'LL DO THIS)

Files to create/modify:
- `src/config/supabase.ts` - Supabase client configuration
- `src/controllers/*` - Replace MongoDB queries with Supabase
- `src/middleware/auth.ts` - Use Supabase auth
- Update `.env` with Supabase credentials
- Install `@supabase/supabase-js` package

### Step 5: Update Frontend Code (I'LL DO THIS)

Files to create/modify:
- `src/config/supabase.ts` - Frontend Supabase client
- `src/services/*` - Replace all API calls to use Supabase directly
- Update `.env` files
- Install `@supabase/supabase-js` and auth UI packages

### Step 6: Test Everything

Test checklist:
- [ ] Login works
- [ ] Register works
- [ ] Dashboard loads
- [ ] Can complete courses and earn XP
- [ ] Leaderboard updates
- [ ] Admin panel works
- [ ] Can create/edit users (admin)
- [ ] Analytics display correctly

### Step 7: Deploy

- Update environment variables on Render
- Deploy backend
- Deploy frontend

---

## 🔑 Environment Variables

### Backend (.env)
```env
# Remove these:
# MONGODB_URI=...
# JWT_SECRET=...
# JWT_REFRESH_SECRET=...

# Add these:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key)
SUPABASE_ANON_KEY=eyJhbGc... (anon key)

# Keep these:
PORT=5001
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env)
```env
# Remove these:
# VITE_API_URL=http://localhost:5001/api

# Add these:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (anon key only!)

# Note: Frontend will communicate directly with Supabase for most operations
# Backend will only be used for complex business logic
```

---

## 📊 Database Schema Overview

### Tables Created:
1. **profiles** - User information (extends auth.users)
2. **schools** - School data
3. **user_progress** - XP, levels, streaks
4. **badges** - Badge definitions
5. **user_badges** - User's earned badges
6. **courses** - Course catalog
7. **video_progress** - Course completion tracking
8. **resources** - Resource library
9. **resource_downloads** - Download tracking
10. **activities** - Activity feed
11. **training_sessions** - Training events
12. **session_registrations** - Event registrations

### PostgreSQL Functions:
1. **award_xp()** - Awards XP and handles level ups
2. **update_streak()** - Updates daily streaks
3. **complete_course()** - Marks course complete, awards XP
4. **get_leaderboard()** - Gets top users by XP
5. **get_analytics_overview()** - Admin analytics

---

## 🚨 Important Notes

### What Changes:
- ❌ No more MongoDB
- ❌ No more custom JWT handling
- ❌ No more Mongoose models
- ✅ Supabase Auth handles authentication
- ✅ Supabase generates REST API automatically
- ✅ Built-in real-time subscriptions
- ✅ Row Level Security for data protection

### What Stays the Same:
- ✅ Frontend UI (React components)
- ✅ Backend business logic structure
- ✅ Cloudinary for file uploads
- ✅ All features work exactly the same
- ✅ User experience unchanged

### Migration Strategy:
- **Direct Cutover**: We'll switch everything at once
- **No Downtime Goal**: Deploy during low-traffic hours
- **Rollback Plan**: Keep MongoDB backup for 1 week

---

## 📝 Next Steps

**FOR YOU:**
1. Create the Supabase project (5 minutes)
2. Get the credentials
3. Tell me when ready

**FOR ME:**
1. Create the complete SQL schema file
2. Update all backend code
3. Update all frontend code
4. Create migration scripts
5. Test everything locally
6. Help you deploy

---

## ⏱️ Estimated Timeline

- Supabase setup: 10 minutes (you)
- Code migration: 60 minutes (me)
- Testing: 20 minutes (together)
- Deployment: 10 minutes (together)
- **Total: ~1.5 hours**

---

## 🎯 Success Criteria

Migration is successful when:
- ✅ All existing features work
- ✅ Users can login with same credentials
- ✅ XP and levels persist
- ✅ Leaderboard works
- ✅ Admin panel functional
- ✅ No errors in console
- ✅ Real-time updates working

---

**Ready to start? Let me know when you've created the Supabase project!**

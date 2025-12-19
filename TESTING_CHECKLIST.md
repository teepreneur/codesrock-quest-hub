# 🧪 CodesRock Migration Testing Checklist

## Overview
This checklist will help you systematically test the migrated CodesRock platform to ensure everything works correctly with Supabase.

---

## ✅ Pre-Testing Setup

### 1. Verify Servers Are Running

- [ ] **Backend Server Running**
  - Open terminal and verify backend is running on port 5001
  - Should see: `✅ Supabase connected successfully`
  - URL: http://localhost:5001

- [ ] **Frontend Server Running**
  - Verify frontend is running on port 8080
  - Should see: `Local: http://localhost:8080/`
  - URL: http://localhost:8080/

- [ ] **No Console Errors**
  - Check both terminal windows for errors
  - Both should be running without crashes

---

## 🗄️ PHASE 1: Database Setup Verification

### Step 1.1: Access Supabase Dashboard

- [ ] Go to https://supabase.com/dashboard
- [ ] Login to your account
- [ ] Select project: **qordfzghwjkpwsfehjjz**
- [ ] You should see the project dashboard

### Step 1.2: Verify Tables Exist

- [ ] Click on **"Table Editor"** in left sidebar
- [ ] Verify these 15 tables exist:
  - [ ] `profiles`
  - [ ] `schools`
  - [ ] `user_progress`
  - [ ] `courses`
  - [ ] `video_progress`
  - [ ] `resources`
  - [ ] `resource_downloads`
  - [ ] `badges`
  - [ ] `user_badges`
  - [ ] `activities`
  - [ ] `training_sessions`
  - [ ] `session_registrations`
  - [ ] `evaluations`
  - [ ] `user_evaluations`
  - [ ] `certificates`

**If tables don't exist:**
1. Go to **SQL Editor** in Supabase
2. Run `supabase-schema.sql` file
3. Run `supabase-rls-policies.sql` file
4. Run `supabase-functions.sql` file

### Step 1.3: Verify PostgreSQL Functions

- [ ] Go to **Database** → **Functions** in Supabase
- [ ] Verify these 6 functions exist:
  - [ ] `award_xp`
  - [ ] `calculate_level`
  - [ ] `update_streak`
  - [ ] `complete_course`
  - [ ] `download_resource`
  - [ ] `get_analytics_overview`
  - [ ] `get_leaderboard`

**If functions don't exist:**
1. Go to **SQL Editor**
2. Run `supabase-functions.sql` file

### Step 1.4: Verify Row Level Security (RLS)

- [ ] Go to **Authentication** → **Policies**
- [ ] Verify RLS is enabled on all tables
- [ ] Check that policies exist for each table

**If RLS not set up:**
1. Go to **SQL Editor**
2. Run `supabase-rls-policies.sql` file

### Step 1.5: Check for Sample Data

- [ ] Click **Table Editor** → **profiles**
  - Check if any test users exist
  - If empty, that's OK - we'll create one

- [ ] Click **Table Editor** → **courses**
  - Check if any courses exist
  - If empty, we'll need to add sample data

**Sample Course Data (if needed):**
```sql
-- Run this in SQL Editor to add a test course
INSERT INTO courses (title, description, category, difficulty, xp_reward, video_url, thumbnail, is_active, is_published)
VALUES
  ('Introduction to HTML', 'Learn the basics of HTML', 'HTML/CSS', 'Beginner', 100,
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   'https://via.placeholder.com/400x225?text=HTML+Course',
   true, true);
```

---

## 🔌 PHASE 2: Backend API Testing

### Step 2.1: Test Basic API Connectivity

Open a new terminal and test with curl:

- [ ] **Test Health Check** (if you have one)
```bash
curl http://localhost:5001/
```
Expected: Server response (or 404 if no root route)

### Step 2.2: Test Auth Endpoints

- [ ] **Test Register Endpoint**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@codesrock.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "role": "teacher"
  }'
```
Expected: Success response with user data

**Save the access token from response for next tests!**

- [ ] **Test Login Endpoint**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@codesrock.com",
    "password": "Test123!@#"
  }'
```
Expected: Success response with token

**Record Issues:**
- Error message: _______________
- Status code: _______________

### Step 2.3: Test Protected Endpoints

Replace `YOUR_TOKEN` with the token from login:

- [ ] **Test Get Profile**
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: User profile data

- [ ] **Test Get Courses**
```bash
curl http://localhost:5001/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: List of courses (or empty array)

- [ ] **Test Get User Progress**
```bash
curl http://localhost:5001/api/progress/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: User progress data with XP and level

---

## 🌐 PHASE 3: Frontend Testing

### Step 3.1: Open Application

- [ ] Open browser to http://localhost:8080/
- [ ] **Open Browser Console** (F12 or Cmd+Option+I)
  - Check for JavaScript errors
  - Check for API call failures
  - Check for Supabase connection errors

**Record any errors here:**
```
Error 1: _______________
Error 2: _______________
```

### Step 3.2: Authentication Flow Testing

#### Register New User

- [ ] Click **"Sign Up"** or **"Register"** button
- [ ] Fill in registration form:
  - Email: `frontend-test@codesrock.com`
  - Password: `Test123!@#`
  - First Name: `Frontend`
  - Last Name: `Tester`
- [ ] Submit form
- [ ] **Check for:**
  - [ ] Success message shown
  - [ ] Redirected to dashboard or login
  - [ ] No console errors

**If registration fails:**
- Check browser console for errors
- Check backend terminal for API errors
- Verify Supabase Auth is enabled

#### Login

- [ ] Go to login page
- [ ] Enter credentials:
  - Email: `frontend-test@codesrock.com`
  - Password: `Test123!@#`
- [ ] Click **"Login"**
- [ ] **Check for:**
  - [ ] Success message
  - [ ] Redirected to dashboard
  - [ ] User info displayed (name, avatar)
  - [ ] Token stored (check localStorage in DevTools)

**localStorage Check:**
```javascript
// Run in browser console:
console.log(localStorage.getItem('token'));
// Should show a JWT token
```

#### Logout

- [ ] Click **"Logout"** button
- [ ] **Check for:**
  - [ ] Redirected to login page
  - [ ] Token removed from localStorage
  - [ ] User info cleared

### Step 3.3: Dashboard Testing

- [ ] Login again if logged out
- [ ] Go to **Dashboard** page
- [ ] **Check for:**
  - [ ] User stats display (XP, level, streak)
  - [ ] Recent activities shown
  - [ ] Course progress displayed
  - [ ] No loading errors

**Record Dashboard Data:**
- Current XP: _______________
- Current Level: _______________
- Level Name: _______________
- Streak: _______________

### Step 3.4: Courses Feature Testing

#### View Courses

- [ ] Navigate to **Courses** page
- [ ] **Check for:**
  - [ ] Course list loads
  - [ ] Course cards display properly
  - [ ] Categories filter works
  - [ ] Search functionality works

#### View Single Course

- [ ] Click on a course card
- [ ] **Check for:**
  - [ ] Course details page loads
  - [ ] Video player displays (if video URL valid)
  - [ ] Course description shown
  - [ ] XP reward displayed
  - [ ] Prerequisite info (if any)

#### Track Video Progress

- [ ] Play course video (or simulate)
- [ ] Wait a few seconds
- [ ] **Check for:**
  - [ ] Progress being tracked
  - [ ] Watch percentage updating
  - [ ] No console errors

**Backend Check:**
```bash
# In Supabase Table Editor, check video_progress table
# Should see a new row for this user/course
```

#### Complete Course

- [ ] Watch video to 100% (or use API)
- [ ] **Check for:**
  - [ ] "Course completed" message
  - [ ] XP awarded notification
  - [ ] XP increased in dashboard
  - [ ] Possible level up message

**Test with curl if needed:**
```bash
curl -X POST http://localhost:5001/api/courses/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "courseId": "COURSE_ID",
    "watchedSeconds": 300,
    "totalSeconds": 300,
    "completed": true
  }'
```

### Step 3.5: Gamification Testing

#### Check XP and Levels

- [ ] Go to **Dashboard**
- [ ] Verify current XP and level display
- [ ] **Record:**
  - Starting XP: _______________
  - Starting Level: _______________

#### Earn XP

- [ ] Complete a course (if not done)
- [ ] Download a resource
- [ ] **Check for:**
  - [ ] XP increases
  - [ ] Progress bar updates
  - [ ] Activity logged

#### View Leaderboard

- [ ] Navigate to **Leaderboard** page
- [ ] **Check for:**
  - [ ] User rankings display
  - [ ] Your user appears in list
  - [ ] XP amounts shown
  - [ ] Level names displayed

#### View Badges

- [ ] Navigate to **Achievements** or **Badges** page
- [ ] **Check for:**
  - [ ] Available badges list
  - [ ] Earned badges highlighted
  - [ ] Badge requirements shown
  - [ ] Locked badges shown

#### Test Streak

- [ ] **Check current streak:**
```bash
curl http://localhost:5001/api/progress/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] **Update streak:**
```bash
curl -X POST http://localhost:5001/api/progress/streak \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

- [ ] **Check for:**
  - [ ] Streak maintained or reset correctly
  - [ ] Last activity date updated

### Step 3.6: Resources Testing

#### Browse Resources

- [ ] Navigate to **Resources** page
- [ ] **Check for:**
  - [ ] Resource list loads
  - [ ] Resource cards display
  - [ ] File type icons show
  - [ ] Filters work (type, category)

#### Download Resource

- [ ] Click **"Download"** on a resource
- [ ] **Check for:**
  - [ ] Download initiated
  - [ ] XP awarded (first time only)
  - [ ] Download count increases
  - [ ] Activity logged

**Verify in database:**
```sql
-- Check in Supabase Table Editor
SELECT * FROM resource_downloads WHERE user_id = 'YOUR_USER_ID';
```

#### Rate Resource

- [ ] Click on a resource
- [ ] Give it a rating (1-5 stars)
- [ ] **Check for:**
  - [ ] Rating submitted successfully
  - [ ] Average rating updates
  - [ ] Your rating saved

### Step 3.7: Training Sessions Testing

#### View Sessions Calendar

- [ ] Navigate to **Calendar** or **Sessions** page
- [ ] **Check for:**
  - [ ] Sessions list/calendar displays
  - [ ] Session details visible
  - [ ] Registration button appears

#### Register for Session

- [ ] Click **"Register"** for a session
- [ ] **Check for:**
  - [ ] Registration success message
  - [ ] Button changes to "Registered"
  - [ ] Participant count increases

**Verify in database:**
```sql
SELECT * FROM session_registrations WHERE user_id = 'YOUR_USER_ID';
```

#### Attend Session (if applicable)

- [ ] Mark attendance (if feature exists)
- [ ] **Check for:**
  - [ ] Attendance recorded
  - [ ] XP awarded for attendance
  - [ ] Status updated

---

## 👨‍💼 PHASE 4: Admin Features Testing

**Note:** You need an admin user for these tests.

### Step 4.1: Create Admin User

Run this in Supabase SQL Editor:
```sql
-- Create admin user
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'test@codesrock.com';
```

### Step 4.2: Admin Dashboard

- [ ] Login as admin user
- [ ] Navigate to **Admin** section
- [ ] **Check for:**
  - [ ] Admin dashboard loads
  - [ ] Platform statistics display
  - [ ] Charts/graphs render (if any)

### Step 4.3: User Management

- [ ] Go to **Admin** → **Users**
- [ ] **Check for:**
  - [ ] User list loads with pagination
  - [ ] Search functionality works
  - [ ] Filters work (role, status)

#### Create User

- [ ] Click **"Create User"** or **"Add User"**
- [ ] Fill in form:
  - Email: `admin-created@codesrock.com`
  - First Name: `Admin`
  - Last Name: `Created`
  - Role: `teacher`
- [ ] Submit
- [ ] **Check for:**
  - [ ] User created successfully
  - [ ] Appears in user list
  - [ ] Temp password shown (save it)

#### Edit User

- [ ] Click **"Edit"** on a user
- [ ] Change first name to `Modified`
- [ ] Submit
- [ ] **Check for:**
  - [ ] Changes saved
  - [ ] User list updated

#### Reset User Password

- [ ] Click **"Reset Password"** on a user
- [ ] **Check for:**
  - [ ] Password reset successful
  - [ ] New temp password shown

### Step 4.4: Content Management

#### Manage Courses

- [ ] Go to **Admin** → **Content** → **Courses**
- [ ] **Check for:**
  - [ ] Course list with stats
  - [ ] View count, completion count shown

#### Create Course

- [ ] Click **"Create Course"**
- [ ] Fill in form:
  - Title: `Admin Test Course`
  - Description: `Test course created by admin`
  - Category: `JavaScript`
  - Difficulty: `Intermediate`
  - XP Reward: `150`
  - Video URL: `https://youtube.com/watch?v=test`
- [ ] Submit
- [ ] **Check for:**
  - [ ] Course created
  - [ ] Appears in course list
  - [ ] Visible to teachers

#### Edit Course

- [ ] Click **"Edit"** on the test course
- [ ] Change title to `Updated Test Course`
- [ ] Submit
- [ ] **Check for:**
  - [ ] Changes saved
  - [ ] Title updated everywhere

#### Delete/Deactivate Course

- [ ] Click **"Delete"** on test course
- [ ] Confirm deletion
- [ ] **Check for:**
  - [ ] Course marked as inactive
  - [ ] No longer visible to teachers
  - [ ] Still in database (soft delete)

#### Manage Resources

- [ ] Go to **Admin** → **Content** → **Resources**
- [ ] Repeat similar tests as courses:
  - [ ] Create resource
  - [ ] Edit resource
  - [ ] Delete resource

### Step 4.5: Analytics

- [ ] Go to **Admin** → **Analytics**
- [ ] **Check for:**
  - [ ] Platform overview statistics
  - [ ] User engagement metrics
  - [ ] Course completion rates
  - [ ] Popular resources

---

## 🔄 PHASE 5: Integration Testing

### Step 5.1: Complete User Journey

Test a full user workflow:

- [ ] **New user signs up**
- [ ] **Completes profile**
- [ ] **Browses courses**
- [ ] **Watches and completes a course**
- [ ] **Earns XP and levels up**
- [ ] **Unlocks a badge**
- [ ] **Downloads a resource**
- [ ] **Checks leaderboard position**
- [ ] **Registers for training session**
- [ ] **Views certificates (if earned)**

### Step 5.2: Test Real-time Updates (if implemented)

- [ ] Open two browser windows
- [ ] Login as different users in each
- [ ] Have one user complete a course
- [ ] **Check if:**
  - [ ] Leaderboard updates in other window
  - [ ] Activity feed updates
  - [ ] Statistics refresh

### Step 5.3: Error Handling

Test that errors are handled gracefully:

- [ ] **Invalid login credentials**
  - [ ] Error message displayed
  - [ ] No crash

- [ ] **Register with existing email**
  - [ ] Error message displayed
  - [ ] Form validation works

- [ ] **Access protected route without auth**
  - [ ] Redirected to login
  - [ ] No crash

- [ ] **Submit form with missing fields**
  - [ ] Validation errors shown
  - [ ] Specific field errors highlighted

### Step 5.4: Browser Console Check

- [ ] Open DevTools Console
- [ ] Navigate through entire app
- [ ] **Check for:**
  - [ ] No red errors
  - [ ] No failed API calls
  - [ ] No Supabase connection errors

---

## 📊 PHASE 6: Performance Testing

### Step 6.1: Page Load Times

Test with browser DevTools (Network tab):

- [ ] **Dashboard load time:** _____ seconds
- [ ] **Courses page load time:** _____ seconds
- [ ] **Admin page load time:** _____ seconds

**Acceptable:** < 3 seconds

### Step 6.2: API Response Times

Use browser Network tab or curl with timing:

```bash
time curl http://localhost:5001/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] **Auth endpoints:** < 1 second
- [ ] **Data endpoints:** < 2 seconds
- [ ] **Complex queries:** < 3 seconds

### Step 6.3: Database Query Performance

Check in Supabase:
- [ ] Go to **Database** → **Query Performance**
- [ ] Look for slow queries (> 1 second)
- [ ] Note any that need optimization

---

## 🐛 PHASE 7: Bug Documentation

### Issues Found

| # | Component | Issue | Severity | Status |
|---|-----------|-------|----------|--------|
| 1 | _________ | _____ | High/Med/Low | Open/Fixed |
| 2 | _________ | _____ | High/Med/Low | Open/Fixed |
| 3 | _________ | _____ | High/Med/Low | Open/Fixed |

### Common Issues and Fixes

#### CORS Errors
**Symptom:** "Access blocked by CORS policy"
**Fix:** Update backend `.env`:
```env
FRONTEND_URL=http://localhost:8080
```
Then restart backend.

#### Supabase Connection Failed
**Symptom:** "Missing Supabase environment variables"
**Fix:** Check `.env` files have correct Supabase URL and keys.

#### Tables Don't Exist
**Symptom:** "relation 'profiles' does not exist"
**Fix:** Run the SQL files in Supabase SQL Editor:
1. supabase-schema.sql
2. supabase-rls-policies.sql
3. supabase-functions.sql

#### RLS Policy Errors
**Symptom:** "new row violates row-level security policy"
**Fix:** Check RLS policies in Supabase or temporarily disable for testing.

---

## ✅ PHASE 8: Sign-off Checklist

### Critical Features

- [ ] ✅ Users can register
- [ ] ✅ Users can login/logout
- [ ] ✅ Courses display correctly
- [ ] ✅ Video progress tracks
- [ ] ✅ XP awards correctly
- [ ] ✅ Level ups work
- [ ] ✅ Resources can be downloaded
- [ ] ✅ Leaderboard displays
- [ ] ✅ Admin can manage users
- [ ] ✅ Admin can manage content

### Nice-to-Have Features

- [ ] Badges unlock properly
- [ ] Streaks maintain correctly
- [ ] Training sessions work
- [ ] Certificates generate
- [ ] Analytics display
- [ ] Search functionality works

### Security

- [ ] Authentication required for protected routes
- [ ] Users can only access their own data
- [ ] Admin features restricted to admins
- [ ] Passwords hashed (Supabase handles this)
- [ ] RLS policies enforced

### Data Integrity

- [ ] XP calculations correct
- [ ] Level calculations correct
- [ ] Progress tracking accurate
- [ ] Download tracking accurate
- [ ] Activity feed accurate

---

## 🎉 Testing Complete!

### Summary

**Total Tests:** ______ / ______
**Passed:** ______
**Failed:** ______
**Skipped:** ______

### Overall Status

- [ ] ✅ **PASS** - Ready for production
- [ ] ⚠️ **PASS WITH ISSUES** - Minor fixes needed
- [ ] ❌ **FAIL** - Major issues found

### Next Steps

If PASS:
1. Fix any minor issues
2. Deploy to staging environment
3. Run tests again in staging
4. Deploy to production

If FAIL:
1. Review failed tests
2. Fix critical issues
3. Re-run testing checklist

---

## 📝 Notes

Add any additional observations, issues, or recommendations:

```
___________________________________________
___________________________________________
___________________________________________
```

---

**Testing Date:** ________________
**Tester Name:** ________________
**Tester Email:** ________________
**Migration Version:** MongoDB → Supabase Complete
**Status:** ________________

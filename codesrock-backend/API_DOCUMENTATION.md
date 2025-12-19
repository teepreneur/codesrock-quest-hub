# CodesRock Quest Hub - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📚 Table of Contents
1. [Authentication](#authentication-endpoints)
2. [Gamification](#gamification-endpoints)
3. [Courses](#course-endpoints)
4. [Resources](#resource-endpoints)
5. [Evaluations & Certificates](#evaluation--certificate-endpoints)
6. [Training Sessions](#training-session-endpoints)
7. [Dashboard](#dashboard-endpoints)

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "teacher@codesrock.org",
  "password": "Codesrock2024"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Gamification Endpoints

### Get User Progress
```http
GET /progress/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "currentXP": 150,
      "totalXP": 150,
      "currentLevel": 2,
      "levelName": "Tech Explorer",
      "streak": 3,
      "badges": [...]
    },
    "levelDetails": {
      "current": { "level": 2, "name": "Tech Explorer", "minXP": 100, "maxXP": 249 },
      "next": { "level": 3, "name": "Digital Creator", "minXP": 250, "maxXP": 449 },
      "progressToNextLevel": 50
    }
  }
}
```

### Add XP
```http
POST /progress/xp
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "amount": 50,
  "description": "Completed HTML basics course",
  "metadata": { "courseId": "..." }
}
```

### Get Leaderboard
```http
GET /leaderboard?limit=10
Authorization: Bearer <token>
```

### Update Streak
```http
POST /progress/streak
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

### Get All Badges
```http
GET /badges?category=Achievement
Authorization: Bearer <token>
```

### Get User Badges
```http
GET /badges/user/:userId
Authorization: Bearer <token>
```

### Award Badge
```http
POST /badges/award
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "badgeId": "64b2c3d4e5f6g7h8i9j0k1l2"
}
```

### Get Activity Feed
```http
GET /activities/:userId?limit=20&page=1
Authorization: Bearer <token>
```

### Get All Levels
```http
GET /levels
Authorization: Bearer <token>
```

---

## Course Endpoints

### Get All Courses
```http
GET /courses?category=JavaScript&difficulty=Beginner&userId=xxx
Authorization: Bearer <token>
```

**Response includes user progress if userId is provided**

### Get Course by ID
```http
GET /courses/:courseId?userId=xxx
Authorization: Bearer <token>
```

### Get Courses by Category
```http
GET /courses/category/:category?userId=xxx
Authorization: Bearer <token>
```

Categories: `HTML/CSS`, `JavaScript`, `Computer Science`, `Coding`

### Update Video Progress
```http
POST /courses/progress
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "courseId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "watchedSeconds": 300,
  "totalSeconds": 600,
  "notes": "Great tutorial on arrays"
}
```

**Awards XP when 80% completion is reached**

### Get User Course Progress
```http
GET /courses/progress/:userId
Authorization: Bearer <token>
```

### Get Recommended Courses
```http
GET /courses/recommended/:userId?limit=5
Authorization: Bearer <token>
```

### Add Bookmark
```http
POST /courses/bookmark
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "courseId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "time": 180,
  "note": "Important concept explained here"
}
```

---

## Resource Endpoints

### Get Resources
```http
GET /resources?category=Worksheets&gradeLevel=Middle&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `category`: Lesson Plans, Worksheets, Projects, Guides, Templates
- `gradeLevel`: Elementary, Middle, High, All
- `fileType`: PDF, DOC, DOCX, ZIP, PPT, PPTX
- `userId`: (optional) to include user interaction data

### Get Resource by ID
```http
GET /resources/:resourceId?userId=xxx
Authorization: Bearer <token>
```

### Download Resource
```http
POST /resources/download
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "resourceId": "64b2c3d4e5f6g7h8i9j0k1l2"
}
```

**Awards 10 XP on first download**

### Rate Resource
```http
POST /resources/rate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "resourceId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "rating": 5,
  "review": "Excellent resource for teaching JavaScript basics"
}
```

### Get Popular Resources
```http
GET /resources/popular?limit=10
Authorization: Bearer <token>
```

### Get User Downloads
```http
GET /resources/downloads/:userId?page=1&limit=20
Authorization: Bearer <token>
```

---

## Evaluation & Certificate Endpoints

### Get All Evaluations
```http
GET /evaluations?type=Self-Assessment
Authorization: Bearer <token>
```

### Get Evaluation by ID
```http
GET /evaluations/:evaluationId
Authorization: Bearer <token>
```

### Start Evaluation
```http
POST /evaluations/start
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "evaluationId": "64b2c3d4e5f6g7h8i9j0k1l2"
}
```

### Update Evaluation Progress
```http
PUT /evaluations/progress
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "evaluationId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "completedItems": ["item-1", "item-2", "item-3"]
}
```

### Submit Evaluation
```http
POST /evaluations/submit
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "evaluationId": "64b2c3d4e5f6g7h8i9j0k1l2"
}
```

### Review Evaluation (Admin/Teacher)
```http
POST /evaluations/review
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userEvaluationId": "64c3d4e5f6g7h8i9j0k1l2m3",
  "reviewerId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "status": "approved",
  "feedback": "Excellent work! Keep it up."
}
```

**Generates certificate if approved and passing score met**

### Get User Evaluations
```http
GET /evaluations/user/:userId
Authorization: Bearer <token>
```

### Verify Certificate
```http
GET /certificates/verify/:certificateNumber
Authorization: Bearer <token>
```

### Get User Certificates
```http
GET /certificates/user/:userId
Authorization: Bearer <token>
```

---

## Training Session Endpoints

### Get All Sessions
```http
GET /sessions?status=scheduled&upcoming=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: scheduled, live, completed, cancelled
- `type`: live, recorded
- `upcoming`: true/false

### Get Session by ID
```http
GET /sessions/:sessionId?userId=xxx
Authorization: Bearer <token>
```

### Register for Session (RSVP)
```http
POST /sessions/register
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "sessionId": "64b2c3d4e5f6g7h8i9j0k1l2"
}
```

### Mark Attendance
```http
POST /sessions/attend
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "sessionId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "duration": 120
}
```

**Awards 25 XP for attendance**

### Submit Session Feedback
```http
POST /sessions/feedback
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "sessionId": "64b2c3d4e5f6g7h8i9j0k1l2",
  "rating": 5,
  "feedback": "Very informative session!"
}
```

### Get User Sessions
```http
GET /sessions/user/:userId
Authorization: Bearer <token>
```

**Returns:** upcoming, attended, and missed sessions

### Get Calendar View
```http
GET /sessions/calendar?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

---

## Dashboard Endpoints

### Get User Dashboard
```http
GET /dashboard/:userId
Authorization: Bearer <token>
```

**Returns comprehensive dashboard data:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "progress": {
      "currentXP": 350,
      "totalXP": 350,
      "currentLevel": 3,
      "levelName": "Digital Creator",
      "streak": 5,
      "badgeCount": 3
    },
    "stats": {
      "totalCourses": 16,
      "completedCourses": 2,
      "inProgressCourses": 1,
      "leaderboardPosition": 1
    },
    "recentActivities": [...],
    "courseProgress": [...],
    "upcomingSessions": [...],
    "recommendedCourses": [...],
    "evaluations": [...]
  }
}
```

### Get Admin Statistics
```http
GET /dashboard/admin/stats
Authorization: Bearer <token>
```

**Returns platform-wide statistics**

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## XP Reward System

| Action | XP Reward |
|--------|-----------|
| Complete Course (Beginner) | 50 XP |
| Complete Course (Intermediate) | 75 XP |
| Complete Course (Advanced) | 100 XP |
| Download Resource (first time) | 10 XP |
| Attend Training Session | 25 XP |
| Pass Evaluation | 150 XP |
| Earn Badge | Variable (25-500 XP) |

---

## Level System

| Level | Name | XP Range |
|-------|------|----------|
| 1 | Code Cadet | 0-99 |
| 2 | Tech Explorer | 100-249 |
| 3 | Digital Creator | 250-449 |
| 4 | Innovation Scout | 450-699 |
| 5 | Tech Mentor | 700-999 |
| 6 | Digital Champion | 1000-1349 |
| 7 | Innovation Leader | 1350-1749 |
| 8 | CodesRock Champion | 1750+ |

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

---

## Testing

Demo accounts for testing:
```
Teacher: teacher@codesrock.org / Codesrock2024
Admin:   admin@codesrock.org / Admin2024
Student: student@codesrock.org / Student2024
```

---

## Notes

1. All timestamps are in ISO 8601 format
2. MongoDB ObjectIDs are 24-character hex strings
3. Pagination uses `page` and `limit` query parameters
4. All protected routes require valid JWT token
5. XP is awarded automatically for completing actions
6. Badges are checked and awarded automatically when conditions are met
7. Streak resets if no activity for more than 48 hours
8. Course completion requires 80% watch time

# CodesRock Quest Hub - Backend API

A comprehensive gamified learning platform for the CodesRock Teacher Portal with complete features including courses, resources, evaluations, certificates, and training sessions.

## 🚀 Features

- **Gamification System**: XP, levels (1-8), badges, streaks, and leaderboards
- **Video Course System**: 16 courses across 4 categories with progress tracking
- **Resource Library**: 20+ educational resources with downloads and ratings
- **Evaluation & Certificates**: Assessment system with automatic certificate generation
- **Training Sessions**: Live and recorded sessions with RSVP and attendance tracking
- **Unified Dashboard**: Complete user dashboard with all activities and stats
- **JWT Authentication**: Secure authentication with access and refresh tokens

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## 📁 Project Structure

```
codesrock-backend/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── authController.ts
│   │   ├── gamificationController.ts
│   │   ├── courseController.ts
│   │   ├── resourceController.ts
│   │   ├── evaluationController.ts
│   │   ├── sessionController.ts
│   │   └── dashboardController.ts
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts
│   │   ├── validator.ts
│   │   └── errorHandler.ts
│   ├── models/              # Mongoose models
│   │   ├── User.ts
│   │   ├── Level.ts
│   │   ├── Badge.ts
│   │   ├── Activity.ts
│   │   ├── UserProgress.ts
│   │   ├── Course.ts
│   │   ├── VideoProgress.ts
│   │   ├── Resource.ts
│   │   ├── ResourceInteraction.ts
│   │   ├── Evaluation.ts
│   │   ├── UserEvaluation.ts
│   │   ├── Certificate.ts
│   │   ├── TrainingSession.ts
│   │   └── SessionRegistration.ts
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts
│   │   ├── gamificationRoutes.ts
│   │   ├── courseRoutes.ts
│   │   ├── resourceRoutes.ts
│   │   ├── evaluationRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   └── dashboardRoutes.ts
│   ├── utils/               # Utilities and seeders
│   │   ├── db.ts
│   │   ├── jwt.ts
│   │   ├── seeder.ts
│   │   ├── seedGamification.ts
│   │   ├── seedCourses.ts
│   │   ├── seedResources.ts
│   │   └── seedAll.ts
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
├── API_DOCUMENTATION.md
└── README.md
```

## 📦 Installation

1. **Navigate to backend directory**
```bash
cd codesrock-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Edit .env with your configuration
```

## 🔐 Environment Variables

Your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://Cluster15893:TXhYeXhtX11J@cluster15893.xrqbds9.mongodb.net/codesrock?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=codesrock-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## 🗄️ Database Setup

### Seed Complete Database (Recommended)

```bash
npm run seed:all
```

This creates:
- ✅ 3 demo users (teacher, admin, student)
- ✅ 10 badges with varying rarities
- ✅ User progress tracking for all users
- ✅ 16 courses across 4 categories
- ✅ 20 educational resources
- ✅ 2 sample evaluations
- ✅ 5 upcoming training sessions

### Individual Seeders (Optional)

```bash
npm run seed              # Users only
npm run seed:gamification # Gamification system
npm run seed:courses      # Courses
npm run seed:resources    # Resources
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

Server starts on `http://localhost:5000`

### Production Build
```bash
npm run build  # Compile TypeScript
npm start      # Run production server
```

## 📚 API Documentation

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for complete API reference.

### Demo Accounts

```
Teacher: teacher@codesrock.org / Codesrock2024
Admin:   admin@codesrock.org / Admin2024
Student: student@codesrock.org / Student2024
```

### Quick Test

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@codesrock.org","password":"Codesrock2024"}'

# 2. Get dashboard (replace USER_ID and TOKEN)
curl http://localhost:5000/api/dashboard/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎮 Gamification System

### Levels (1-8)
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

### XP Rewards
- Complete Course (Beginner): **50 XP**
- Complete Course (Intermediate): **75 XP**
- Complete Course (Advanced): **100 XP**
- Download Resource: **10 XP** (first time)
- Attend Training Session: **25 XP**
- Pass Evaluation: **150 XP**
- Earn Badge: **25-500 XP** (varies)

## 📊 Complete API Endpoint List

### Authentication (7 endpoints)
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- PUT `/api/auth/profile`
- PUT `/api/auth/change-password`

### Gamification (9 endpoints)
- GET `/api/progress/:userId`
- POST `/api/progress/xp`
- GET `/api/leaderboard`
- POST `/api/progress/streak`
- GET `/api/badges`
- GET `/api/badges/user/:userId`
- POST `/api/badges/award`
- GET `/api/activities/:userId`
- GET `/api/levels`

### Courses (7 endpoints)
- GET `/api/courses`
- GET `/api/courses/:courseId`
- GET `/api/courses/category/:category`
- POST `/api/courses/progress`
- GET `/api/courses/progress/:userId`
- GET `/api/courses/recommended/:userId`
- POST `/api/courses/bookmark`

### Resources (6 endpoints)
- GET `/api/resources`
- GET `/api/resources/popular`
- GET `/api/resources/:resourceId`
- POST `/api/resources/download`
- POST `/api/resources/rate`
- GET `/api/resources/downloads/:userId`

### Evaluations & Certificates (8 endpoints)
- GET `/api/evaluations`
- GET `/api/evaluations/:evaluationId`
- POST `/api/evaluations/start`
- PUT `/api/evaluations/progress`
- POST `/api/evaluations/submit`
- POST `/api/evaluations/review`
- GET `/api/evaluations/user/:userId`
- GET `/api/certificates/verify/:certificateNumber`
- GET `/api/certificates/user/:userId`

### Training Sessions (7 endpoints)
- GET `/api/sessions`
- GET `/api/sessions/calendar`
- GET `/api/sessions/:sessionId`
- POST `/api/sessions/register`
- POST `/api/sessions/attend`
- POST `/api/sessions/feedback`
- GET `/api/sessions/user/:userId`

### Dashboard (2 endpoints)
- GET `/api/dashboard/:userId`
- GET `/api/dashboard/admin/stats`

**Total: 46+ API Endpoints**

## 🧪 Testing Features

### Test XP System
```bash
# Login as teacher
# Add XP
curl -X POST http://localhost:5000/api/progress/xp \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","amount":100,"description":"Test XP"}'

# Check progress
curl http://localhost:5000/api/progress/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

### Test Course Completion
```bash
# Update course progress (80% triggers completion & XP)
curl -X POST http://localhost:5000/api/courses/progress \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"USER_ID",
    "courseId":"COURSE_ID",
    "watchedSeconds":480,
    "totalSeconds":600
  }'
```

### Test Resource Download
```bash
# Download resource (awards 10 XP first time)
curl -X POST http://localhost:5000/api/resources/download \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","resourceId":"RESOURCE_ID"}'
```

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token authentication
- ✅ CORS configured for frontend
- ✅ Input validation on all routes
- ✅ MongoDB injection prevention
- ✅ Error stack traces only in development
- ✅ Protected routes middleware

## 📝 Scripts Reference

```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "ts-node src/utils/seeder.ts",
  "seed:gamification": "ts-node src/utils/seedGamification.ts",
  "seed:courses": "ts-node src/utils/seedCourses.ts",
  "seed:resources": "ts-node src/utils/seedResources.ts",
  "seed:all": "ts-node src/utils/seedAll.ts"
}
```

## 🚨 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

HTTP Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Server Error

## 📈 Future Enhancements

- [ ] Rate limiting
- [ ] Redis caching
- [ ] Email notifications
- [ ] File upload system
- [ ] WebSocket for real-time features
- [ ] Advanced analytics
- [ ] Automated testing suite
- [ ] Docker containerization

## 📄 License

ISC

---

**Built with ❤️ for CodesRock Education**

Start the system:
1. `npm run seed:all` - Initialize database
2. `npm run dev` - Start server
3. Visit API_DOCUMENTATION.md for endpoint details

# CodesRock Quest Hub - Setup Guide

## Backend Setup (Port 5001)

### Prerequisites
- Node.js installed
- MongoDB connection string

### Steps

1. Navigate to backend directory:
   ```bash
   cd codesrock-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with MongoDB connection:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   JWT_SECRET=your_jwt_secret_here
   ```

4. Seed the database:
   ```bash
   npm run seed:all
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5001`

### Demo User Accounts

After seeding, you can login with:

| Role    | Email                      | Password       |
|---------|----------------------------|----------------|
| Teacher | teacher@codesrock.org      | Codesrock2024  |
| Admin   | admin@codesrock.org        | Admin2024      |
| Student | student@codesrock.org      | Student2024    |

### Debug Users

To check existing users in the database:
```bash
npx ts-node src/utils/debugUsers.ts
```

## Frontend Setup

### Prerequisites
- Node.js installed
- Backend running on port 5001

### Steps

1. Navigate to root directory (where frontend is located):
   ```bash
   cd /Users/triumphtetteh/Documents/CodesRock/codesrock-quest-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is already created with:
   ```env
   VITE_API_URL=http://localhost:5001
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:8081` (or another port depending on your configuration)

## Testing the Integration

### Test Backend Login (Terminal)
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@codesrock.org","password":"Codesrock2024"}'
```

Expected response: JSON with user data, accessToken, and refreshToken

### Test Frontend Login (Browser)
1. Open browser to frontend URL (usually `http://localhost:8081`)
2. Login page should load
3. Use credentials:
   - Email: `teacher@codesrock.org`
   - Password: `Codesrock2024`
4. Click Login
5. Should see success message and redirect to dashboard

**Note**: The backend CORS is configured to allow any `localhost` port in development, so you can run the frontend on any port (5173, 8081, 3000, etc.)

## API Service Layer

The frontend now has a complete API service layer:

### Files Created
- `src/config/api.config.ts` - API configuration and endpoint definitions
- `src/services/api.service.ts` - Base API client with auto token refresh
- `src/services/auth.service.ts` - Authentication service
- `src/services/gamification.service.ts` - Gamification service
- `src/services/course.service.ts` - Course service
- `src/services/resource.service.ts` - Resource service
- `src/services/index.ts` - Service exports

### Using the Services

Import and use services in your components:

```typescript
import { authService, courseService, gamificationService } from '@/services';

// Login
const response = await authService.login({ email, password });

// Get courses
const courses = await courseService.getCourses();

// Get user progress
const progress = await gamificationService.getProgress();
```

## Troubleshooting

### Backend Issues
- **MongoDB connection error**: Check your `MONGODB_URI` in backend `.env`
- **Port 5001 already in use**: Change PORT in backend `.env`
- **Login fails**: Run `npm run seed:all` again to reset users

### Frontend Issues
- **API calls fail**: Ensure backend is running on port 5001
- **CORS errors**: Backend is configured to allow any localhost port in development. If you still see CORS errors:
  - Check that backend server restarted (if using `npm run dev` with nodemon, it auto-restarts)
  - Verify the frontend is running on a localhost URL
  - For production, add your domain to `ALLOWED_ORIGINS` in backend `.env`
- **TypeScript errors**: Run `npm install` to ensure all dependencies are installed

## Architecture

```
codesrock-quest-hub/
├── codesrock-backend/       # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── .env                 # Backend config
│
├── src/                     # Frontend (React + Vite)
│   ├── config/             # API configuration
│   ├── services/           # API service layer
│   ├── pages/              # Page components
│   └── components/         # UI components
│
└── .env                    # Frontend config
```

## Next Steps

1. Add protected routes using auth state
2. Create auth context/provider for user state management
3. Add logout functionality
4. Implement token refresh on app load
5. Add error boundaries for API errors

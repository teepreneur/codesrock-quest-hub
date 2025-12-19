# CodesRock Backend Setup & Testing Guide

## Prerequisites

Before running the backend, ensure you have:

- ✅ Node.js (v16 or higher)
- ✅ npm or yarn
- ⚠️ MongoDB (local installation or MongoDB Atlas account)

## MongoDB Setup Options

### Option 1: Local MongoDB (Recommended for Development)

#### macOS
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
mongosh
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG Key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a Windows service

### Option 2: MongoDB Atlas (Cloud)

1. **Create a free account** at https://www.mongodb.com/cloud/atlas
2. **Create a cluster** (Free tier available)
3. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
4. **Update .env file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codesrock-quest-hub?retryWrites=true&w=majority
   ```

## Installation & Setup

1. **Navigate to backend directory:**
   ```bash
   cd codesrock-backend
   ```

2. **Dependencies are already installed** (from previous setup)

3. **Environment is configured** (.env file already created)

4. **Seed the database:**
   ```bash
   npm run seed
   ```

   You should see:
   ```
   🌱 Starting database seeding...
   ✓ Cleared existing users
   ✓ Demo user created:
     Email: teacher@codesrock.org
     Name: Sarah Johnson
     Role: teacher
     Password: Codesrock2024
   ✓ Created 2 additional users

   🎉 Database seeding completed successfully!

   📝 Demo Accounts:
   ─────────────────────────────────────────
   Teacher Account:
     Email: teacher@codesrock.org
     Password: Codesrock2024

   Admin Account:
     Email: admin@codesrock.org
     Password: Admin2024

   Student Account:
     Email: student@codesrock.org
     Password: Student2024
   ─────────────────────────────────────────
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   MongoDB Connected: localhost
   Server is running on port 5000
   Environment: development
   ```

## Testing the Authentication API

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-11-19T00:00:00.000Z"
}
```

### 2. Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newteacher@codesrock.org",
    "password": "Teacher2024",
    "firstName": "John",
    "lastName": "Doe",
    "role": "teacher"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "newteacher@codesrock.org",
      "firstName": "John",
      "lastName": "Doe",
      "role": "teacher",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Login with Demo User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@codesrock.org",
    "password": "Codesrock2024"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "teacher@codesrock.org",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "role": "teacher",
      "isActive": true,
      "lastLogin": "2024-11-19T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**💡 Save the accessToken for the next requests!**

### 4. Get Current User Profile (Protected Route)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "teacher@codesrock.org",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "role": "teacher",
      "isActive": true,
      "lastLogin": "2024-11-19T00:00:00.000Z",
      "createdAt": "2024-11-19T00:00:00.000Z",
      "updatedAt": "2024-11-19T00:00:00.000Z"
    }
  }
}
```

### 5. Update Profile (Protected Route)

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Smith"
  }'
```

### 6. Change Password (Protected Route)

```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Codesrock2024",
    "newPassword": "NewPassword2024"
  }'
```

### 7. Refresh Access Token

```bash
# Replace YOUR_REFRESH_TOKEN with the refreshToken from login response
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 8. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Using Postman or Thunder Client

### Import Collection

Create a new collection with these requests:

1. **Health Check** - GET `http://localhost:5000/api/health`

2. **Register** - POST `http://localhost:5000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "test@codesrock.org",
       "password": "Test2024",
       "firstName": "Test",
       "lastName": "User",
       "role": "teacher"
     }
     ```

3. **Login** - POST `http://localhost:5000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "teacher@codesrock.org",
       "password": "Codesrock2024"
     }
     ```

4. **Get Profile** - GET `http://localhost:5000/api/auth/me`
   - Headers: `Authorization: Bearer {{accessToken}}`

## Validation Rules

### Register
- **Email**: Must be valid email format
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **First Name**: 2-50 characters
- **Last Name**: 2-50 characters
- **Role**: Must be 'teacher', 'admin', or 'student'

### Login
- **Email**: Valid email format required
- **Password**: Required

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials or token)
- `403` - Forbidden (account deactivated)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
1. Make sure MongoDB is running: `brew services list` (macOS)
2. Start MongoDB: `brew services start mongodb-community`
3. Or use MongoDB Atlas (cloud option)

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env file
PORT=5001
```

### JWT Secret Not Defined

**Error:** `JWT_SECRET is not defined in environment variables`

**Solution:**
- Ensure `.env` file exists in backend root
- Verify `JWT_SECRET` is set in `.env`

## Next Steps

1. ✅ Authentication system is complete
2. Create additional models (Achievements, Certificates, etc.)
3. Build API endpoints for your application features
4. Connect frontend to backend
5. Implement refresh token rotation (production)
6. Add email verification (optional)
7. Add password reset functionality (optional)

## Demo Accounts

Use these accounts for testing:

### Teacher Account
- Email: `teacher@codesrock.org`
- Password: `Codesrock2024`

### Admin Account
- Email: `admin@codesrock.org`
- Password: `Admin2024`

### Student Account
- Email: `student@codesrock.org`
- Password: `Student2024`

---

**🎉 Your authentication system is ready to use!**

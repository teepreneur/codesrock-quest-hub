# CodesRock Backend API Reference

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

All authentication endpoints return JSON responses.

---

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher"  // Optional: teacher (default), admin, student
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
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

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Validation Errors (422):**
```json
{
  "success": false,
  "message": "Validation Error: [{\"email\":\"Please provide a valid email address\"}]"
}
```

---

### Login

Authenticate a user and receive access and refresh tokens.

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "teacher@codesrock.org",
  "password": "Codesrock2024"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@codesrock.org",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "role": "teacher",
      "isActive": true,
      "lastLogin": "2024-11-19T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

Invalid Credentials (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

Account Deactivated (403):
```json
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support."
}
```

---

### Refresh Token

Get a new access token using a refresh token.

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

---

### Logout

Invalidate the refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Get Current User

Get the authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@codesrock.org",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "role": "teacher",
      "isActive": true,
      "lastLogin": "2024-11-19T12:00:00.000Z",
      "createdAt": "2024-11-18T10:00:00.000Z",
      "updatedAt": "2024-11-19T12:00:00.000Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### Update Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Smith"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@codesrock.org",
      "firstName": "Sarah",
      "lastName": "Smith",
      "role": "teacher",
      "isActive": true
    }
  }
}
```

---

### Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /auth/change-password`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "Codesrock2024",
  "newPassword": "NewPassword2024"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## Other Endpoints

### Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-11-19T12:00:00.000Z"
}
```

---

## Authentication Flow

### Standard Flow

1. **Register** or **Login** → Receive `accessToken` and `refreshToken`
2. **Store tokens** securely (e.g., localStorage, secure cookie)
3. **Make authenticated requests** using `Authorization: Bearer {accessToken}`
4. When `accessToken` expires → Use **Refresh Token** endpoint to get new `accessToken`
5. **Logout** → Invalidate `refreshToken`

### Token Expiry

- **Access Token:** 7 days (configurable via `JWT_EXPIRE` env variable)
- **Refresh Token:** 7 days (same as access token, but can be configured separately)

### Protected Routes

All routes under `/auth/me`, `/auth/profile`, and `/auth/change-password` require authentication.

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Codes

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 201 | Created (successful registration) |
| 400 | Bad Request (missing required fields, duplicate email) |
| 401 | Unauthorized (invalid credentials or token) |
| 403 | Forbidden (account deactivated) |
| 404 | Not Found (user not found) |
| 422 | Validation Error (invalid input format) |
| 500 | Internal Server Error |

---

## Validation Rules

### Email
- Must be a valid email format
- Automatically converted to lowercase
- Whitespace trimmed

### Password
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### First Name / Last Name
- 2-50 characters
- Whitespace trimmed

### Role
- Must be one of: `teacher`, `admin`, `student`
- Default: `teacher`

---

## Common Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation Error: [{\"password\":\"Password must be at least 8 characters long\"}]"
}
```

### Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Token Expired
```json
{
  "success": false,
  "message": "Token expired"
}
```

### User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Example Usage (JavaScript/Fetch)

### Login
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  } else {
    throw new Error(data.message);
  }
};
```

### Get Current User
```javascript
const getCurrentUser = async () => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (data.success) {
    return data.data.user;
  } else {
    throw new Error(data.message);
  }
};
```

### Refresh Token
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.accessToken;
  } else {
    // Refresh token invalid, redirect to login
    window.location.href = '/login';
  }
};
```

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production using packages like:
- `express-rate-limit`
- `rate-limiter-flexible`

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (HttpOnly cookies recommended over localStorage)
3. **Implement token rotation** for refresh tokens
4. **Add rate limiting** to prevent brute force attacks
5. **Validate all inputs** on both client and server
6. **Keep JWT_SECRET secure** and rotate it periodically
7. **Implement refresh token family** to detect token theft
8. **Add account lockout** after multiple failed login attempts

---

## Support

For issues or questions, please refer to:
- SETUP_GUIDE.md - Setup and testing instructions
- README.md - Project overview and structure

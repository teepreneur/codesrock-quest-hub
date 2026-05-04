# Admin Panel Implementation Guide

## ✅ Completed Backend Implementation

### 1. User Model ✅
- Added support for `school_admin`, `content_admin`, `super_admin` roles
- Added `schoolId` field for school association
- Added `permissions` array for granular permissions
- Added `isAdmin()` method to check admin status

**Location**: `codesrock-backend/src/models/User.ts`

### 2. School Model ✅
- Created School model with name, address, region, district, contactEmail
- Added teacherCount tracking
- Added indexes for better query performance

**Location**: `codesrock-backend/src/models/School.ts`

### 3. Role-Based Middleware ✅
- `requireRole(roles)` - Check specific role
- `requireAdmin` - Any admin role
- `requireSuperAdmin` - Super admin only
- `requireContentAdmin` - Content or super admin
- `requireSchoolAdmin` - School or super admin
- `requirePermission(resource, action)` - Granular permissions
- `auditLog` - Logs all admin actions

**Location**: `codesrock-backend/src/middleware/roleAuth.ts`

### 4. Admin Controllers ✅

**Users Controller** (`controllers/admin/usersController.ts`):
- `GET /api/admin/users` - List users with pagination/filters
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/users/stats` - User statistics

**Content Controller** (`controllers/admin/contentController.ts`):
- Course CRUD operations
- Resource CRUD operations
- Content statistics

**Analytics Controller** (`controllers/admin/analyticsController.ts`):
- Dashboard overview
- Teacher analytics
- Course analytics
- Engagement metrics

### 5. Admin Routes ✅
All routes mounted under `/api/admin`:
- `/api/admin/users/*` - User management
- `/api/admin/content/*` - Content management
- `/api/admin/analytics/*` - Analytics endpoints

**Location**: `codesrock-backend/src/routes/admin/`

### 6. Updated Seed Script ✅
New admin accounts created:
- **Super Admin**: admin@codesrock.org / Admin2024!
- **School Admin**: school.admin@codesrock.org / SchoolAdmin2024
- **Content Admin**: content.admin@codesrock.org / ContentAdmin2024
- **Teacher**: teacher@codesrock.org / Codesrock2024
- **Student**: student@codesrock.org / Student2024

**Location**: `codesrock-backend/src/utils/seeder.ts`

## ✅ Completed Frontend Implementation

### 1. Admin Service ✅
Complete API client for all admin endpoints:
- User management methods
- Analytics methods
- Content management methods

**Location**: `codesrock-frontend/src/services/admin.service.ts`

### 2. Admin Dashboard ✅
- Stats cards: Total Teachers, Active Today, Total Courses, Avg Completion
- Platform trends display
- Quick action buttons
- Matches existing design with same card styles

**Location**: `codesrock-frontend/src/pages/admin/AdminDashboard.tsx`

## 🔄 Remaining Frontend Implementation

To complete the admin panel, create these additional files:

### 1. UserManagement Page
**File**: `codesrock-frontend/src/pages/admin/UserManagement.tsx`

**Features Needed**:
- Table with columns: Name, Email, Role, School, Status, Last Login, Actions
- Search bar (searches name/email)
- Filters: Role dropdown, Status dropdown
- Actions per row: Edit, Reset Password, Deactivate/Activate
- Add User button (opens dialog)
- Pagination controls
- Loading states with Skeleton
- Empty state when no users

**Styling**: Use existing Button, Table, Dialog, Input, Select components. Match Dashboard card styling.

### 2. User Form Dialog Component
**File**: `codesrock-frontend/src/components/admin/UserFormDialog.tsx`

**Features**:
- Form fields: First Name, Last Name, Email, Role, Password (for new users)
- Role select: teacher, school_admin, content_admin, super_admin
- Form validation with react-hook-form
- Success/error toasts
- Loading state during submission

### 3. Update App Routing
**File**: `codesrock-frontend/src/App.tsx`

Add admin routes:
```tsx
// After existing routes, add:
<Route path="/admin" element={<ProtectedRoute><AdminRoute /></ProtectedRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="content" element={<ContentManagement />} />
  <Route path="analytics" element={<Analytics />} />
</Route>
```

### 4. Admin Route Protection Component
**File**: `codesrock-frontend/src/components/AdminRoute.tsx`

```tsx
import { Navigate } from 'react-router-dom';
import { authService } from '@/services';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getStoredUser();

  const isAdmin = user && ['admin', 'school_admin', 'content_admin', 'super_admin'].includes(user.role);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### 5. Update Sidebar (Optional Enhancement)
**File**: Update existing sidebar component

Add conditional admin menu items:
```tsx
{user?.isAdmin() && (
  <SidebarItem
    icon={Shield}
    label="Admin Panel"
    to="/admin"
  />
)}
```

## 🧪 Testing Steps

1. **Reseed Database**:
   ```bash
   cd codesrock-backend
   npm run seed
   ```

2. **Start Both Servers**:
   ```bash
   # Terminal 1 - Backend
   cd codesrock-backend
   npm run dev

   # Terminal 2 - Frontend
   cd codesrock-frontend
   npm run dev
   ```

3. **Test Admin Login**:
   - Navigate to http://localhost:8080/login
   - Login with: admin@codesrock.org / Admin2024!
   - Should redirect to /dashboard initially

4. **Access Admin Panel**:
   - Navigate to http://localhost:8080/admin
   - Should see AdminDashboard with stats
   - Click "Manage Users" to go to /admin/users

5. **Test User Management**:
   - View list of all users
   - Search for a user
   - Filter by role
   - Create a new user
   - Edit existing user
   - Reset user password
   - Deactivate a user

6. **Test Role Permissions**:
   - Logout and login as teacher@codesrock.org
   - Try to access /admin - should redirect to /dashboard
   - Login as school.admin@codesrock.org
   - Should access user management but not content management

## 📁 Complete File Structure

```
codesrock-quest-hub/
├── codesrock-backend/
│   └── src/
│       ├── models/
│       │   ├── User.ts ✅
│       │   └── School.ts ✅
│       ├── middleware/
│       │   └── roleAuth.ts ✅
│       ├── controllers/
│       │   └── admin/
│       │       ├── usersController.ts ✅
│       │       ├── contentController.ts ✅
│       │       └── analyticsController.ts ✅
│       ├── routes/
│       │   └── admin/
│       │       ├── index.ts ✅
│       │       ├── usersRoutes.ts ✅
│       │       ├── contentRoutes.ts ✅
│       │       └── analyticsRoutes.ts ✅
│       ├── app.ts ✅ (updated)
│       └── utils/
│           └── seeder.ts ✅ (updated)
│
└── codesrock-frontend/
    └── src/
        ├── services/
        │   ├── admin.service.ts ✅
        │   └── index.ts ✅ (updated)
        ├── pages/
        │   └── admin/
        │       ├── AdminDashboard.tsx ✅
        │       ├── UserManagement.tsx 🔄 (to create)
        │       ├── ContentManagement.tsx 🔄 (optional)
        │       └── Analytics.tsx 🔄 (optional)
        ├── components/
        │   └── admin/
        │       ├── UserFormDialog.tsx 🔄 (to create)
        │       └── AdminRoute.tsx 🔄 (to create)
        └── App.tsx 🔄 (update routing)
```

## 🎨 Design Consistency Checklist

- ✅ Use same Card component styling
- ✅ Use primary orange (#f97316) for main actions
- ✅ Use cyan (#06b6d4) for secondary highlights
- ✅ Use purple (#a855f7) for badges/achievements
- ✅ Use same Button variants (default, outline, ghost)
- ✅ Use same spacing (space-y-6, gap-6)
- ✅ Use same animations (animate-fade-in, hover transitions)
- ✅ Use Skeleton for loading states
- ✅ Use toast notifications from sonner

## 🔐 Security Notes

- All admin routes require authentication
- Role-based access control enforced by middleware
- Audit logging enabled for all admin actions
- Passwords hashed with bcrypt
- JWT tokens for authentication
- XSS/CSRF protection through CORS configuration

## 📊 API Endpoints Reference

### User Management
- `GET /api/admin/users?page=1&limit=10&search=john&role=teacher`
- `GET /api/admin/users/:id`
- `POST /api/admin/users` - Body: {email, firstName, lastName, role, password}
- `PUT /api/admin/users/:id` - Body: {firstName, lastName, role, isActive}
- `DELETE /api/admin/users/:id`
- `POST /api/admin/users/:id/reset-password` - Body: {newPassword}
- `GET /api/admin/users/stats`

### Analytics
- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/teachers/:id`
- `GET /api/admin/analytics/courses`
- `GET /api/admin/analytics/engagement?days=30`

### Content Management
- `GET /api/admin/content/courses`
- `POST /api/admin/content/courses`
- `PUT /api/admin/content/courses/:id`
- `DELETE /api/admin/content/courses/:id`
- `GET /api/admin/content/stats`

## 🚀 Next Steps

1. Create UserManagement.tsx with table and CRUD operations
2. Create UserFormDialog.tsx for add/edit users
3. Create AdminRoute.tsx component for route protection
4. Update App.tsx with admin routes
5. Reseed database with new admin accounts
6. Test all admin functionality end-to-end
7. (Optional) Create ContentManagement and Analytics pages

The core infrastructure is complete. Only the frontend UI components need to be created to have a fully functional admin panel!

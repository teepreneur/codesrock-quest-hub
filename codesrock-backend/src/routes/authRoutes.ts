import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  loginWithSchool,
  refreshAccessToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Register validation rules
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['teacher', 'admin', 'student', 'school_admin', 'content_admin', 'super_admin'])
    .withMessage('Role must be teacher, admin, student, school_admin, content_admin, or super_admin'),
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Login with school validation rules
 */
const loginSchoolValidation = [
  body('schoolCode')
    .trim()
    .notEmpty()
    .withMessage('School ID is required')
    .matches(/^SCH-[A-Z0-9]{6}$/i)
    .withMessage('Invalid School ID format'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Refresh token validation rules
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

/**
 * Update profile validation rules
 */
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
];

/**
 * Change password validation rules
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/login-school', validate(loginSchoolValidation), loginWithSchool);
router.post('/refresh', validate(refreshTokenValidation), refreshAccessToken);

// Protected routes
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, validate(updateProfileValidation), updateProfile);
router.put('/change-password', protect, validate(changePasswordValidation), changePassword);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllSessions,
  getSessionById,
  registerForSession,
  markAttendance,
  submitFeedback,
  getUserSessions,
  getCalendarView,
} from '../controllers/sessionController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Validation rules
 */
const sessionIdParamValidation = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Invalid session ID format'),
];

const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

const registerValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Invalid session ID format'),
];

const attendanceValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Invalid session ID format'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
];

const feedbackValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Invalid session ID format'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['scheduled', 'live', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['live', 'recorded'])
    .withMessage('Invalid type'),
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Upcoming must be a boolean'),
];

// All routes are protected
router.use(protect);

// Session routes
router.get('/sessions', validate(queryValidation), getAllSessions);
router.get('/sessions/calendar', getCalendarView);
router.get('/sessions/:sessionId', validate(sessionIdParamValidation), getSessionById);

// Registration and attendance routes
router.post('/sessions/register', validate(registerValidation), registerForSession);
router.post('/sessions/attend', validate(attendanceValidation), markAttendance);
router.post('/sessions/feedback', validate(feedbackValidation), submitFeedback);

// User session routes
router.get('/sessions/user/:userId', validate(userIdParamValidation), getUserSessions);

export default router;

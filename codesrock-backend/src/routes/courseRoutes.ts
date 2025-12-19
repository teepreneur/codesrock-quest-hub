import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllCourses,
  getCourseById,
  getCoursesByCategory,
  updateVideoProgress,
  getRecommendedCourses,
  bookmarkMoment,
  getUserCourseProgress,
} from '../controllers/courseController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Validation rules
 */
const courseIdParamValidation = [
  param('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isUUID()
    .withMessage('Invalid course ID format'),
];

const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

const categoryParamValidation = [
  param('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['HTML/CSS', 'JavaScript', 'Computer Science', 'Coding'])
    .withMessage('Invalid category'),
];

const updateProgressValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isUUID()
    .withMessage('Invalid course ID format'),
  body('watchedSeconds')
    .isInt({ min: 0 })
    .withMessage('Watched seconds must be a non-negative integer'),
  body('totalSeconds')
    .isInt({ min: 1 })
    .withMessage('Total seconds must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),
];

const bookmarkValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isUUID()
    .withMessage('Invalid course ID format'),
  body('time')
    .isInt({ min: 0 })
    .withMessage('Time must be a non-negative integer'),
  body('note')
    .trim()
    .notEmpty()
    .withMessage('Note is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Note must be between 1 and 500 characters'),
];

const queryValidation = [
  query('userId')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID format'),
  query('category')
    .optional()
    .isIn(['HTML/CSS', 'JavaScript', 'Computer Science', 'Coding'])
    .withMessage('Invalid category'),
  query('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid difficulty'),
];

// All routes are protected
router.use(protect);

// Course routes
router.get('/courses', validate(queryValidation), getAllCourses);
router.get('/courses/:courseId', validate(courseIdParamValidation), getCourseById);
router.get('/courses/category/:category', validate(categoryParamValidation), getCoursesByCategory);

// Progress routes
router.post('/courses/progress', validate(updateProgressValidation), updateVideoProgress);
router.get('/courses/progress/:userId', validate(userIdParamValidation), getUserCourseProgress);

// Recommendation routes
router.get('/courses/recommended/:userId', validate(userIdParamValidation), getRecommendedCourses);

// Bookmark routes
router.post('/courses/bookmark', validate(bookmarkValidation), bookmarkMoment);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUserProgress,
  addXP,
  getLeaderboard,
  updateStreak,
  getAllBadges,
  getUserBadges,
  awardBadge,
  getActivityFeed,
  getAllLevels,
} from '../controllers/gamificationController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Validation rules for adding XP
 */
const addXPValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('XP amount must be a positive integer'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Description must be between 3 and 200 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

/**
 * Validation rules for updating streak
 */
const updateStreakValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

/**
 * Validation rules for awarding badge
 */
const awardBadgeValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isUUID()
    .withMessage('Invalid badge ID format'),
];

/**
 * Validation rules for user ID param
 */
const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

/**
 * Validation rules for query parameters
 */
const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];

// All routes are protected
router.use(protect);

// Progress routes
router.get('/progress/:userId', validate(userIdParamValidation), getUserProgress);
router.post('/progress/xp', validate(addXPValidation), addXP);
router.post('/progress/streak', validate(updateStreakValidation), updateStreak);

// Leaderboard route
router.get('/leaderboard', getLeaderboard);

// Badge routes
router.get('/badges', getAllBadges);
router.get('/badges/user/:userId', validate(userIdParamValidation), getUserBadges);
router.post('/badges/award', validate(awardBadgeValidation), awardBadge);

// Activity routes
router.get(
  '/activities/:userId',
  validate([...userIdParamValidation, ...paginationValidation]),
  getActivityFeed
);

// Levels route
router.get('/levels', getAllLevels);

export default router;

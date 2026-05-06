import { Router } from 'express';
import { query } from 'express-validator';
import { searchUnified } from '../controllers/searchController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All search routes are protected
router.use(protect);

/**
 * @route   GET /api/search
 * @desc    Unified search
 */
router.get(
  '/',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .trim()
  ],
  validate,
  searchUnified
);

export default router;

import { Router } from 'express';
import { param } from 'express-validator';
import { getUserDashboard, getAdminStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

/**
 * Validation rules
 */
const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

// All routes are protected
router.use(protect);

// Dashboard routes
router.get('/dashboard/:userId', validate(userIdParamValidation), getUserDashboard);
router.get(
  '/dashboard/admin/stats',
  authorize('super_admin', 'school_admin', 'content_admin'),
  getAdminStats
);

export default router;

import express from 'express';
import {
  getOverview,
  getTeacherAnalytics,
  getCourseAnalytics,
  getEngagementMetrics,
} from '../../controllers/admin/analyticsController';
import { protect } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleAuth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Analytics routes
router.get('/overview', getOverview);
router.get('/teachers/:id', getTeacherAnalytics);
router.get('/courses', getCourseAnalytics);
router.get('/engagement', getEngagementMetrics);

export default router;

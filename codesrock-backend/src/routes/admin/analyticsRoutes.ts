import express from 'express';
import {
  getOverview,
  getTeacherAnalytics,
  getCourseAnalytics,
  getEngagementMetrics,
  getSchoolAnalytics,
  getSchoolPerformance,
  getTeacherDetailedPerformance,
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
router.get('/schools', getSchoolAnalytics);
router.get('/schools/:id/performance', getSchoolPerformance);
router.get('/teachers/:id/performance', getTeacherDetailedPerformance);

export default router;

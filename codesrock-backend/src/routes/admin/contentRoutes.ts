import express from 'express';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  getContentStats,
} from '../../controllers/admin/contentController';
import { protect } from '../../middleware/auth';
import { requireContentAdmin, auditLog } from '../../middleware/roleAuth';

const router = express.Router();

// All routes require authentication and content admin role
router.use(protect);
router.use(requireContentAdmin);
router.use(auditLog);

// Content stats
router.get('/stats', getContentStats);

// Course routes
router.route('/courses').get(getAllCourses).post(createCourse);

router
  .route('/courses/:id')
  .put(updateCourse)
  .delete(deleteCourse);

// Resource routes
router.route('/resources').get(getAllResources).post(createResource);

router
  .route('/resources/:id')
  .put(updateResource)
  .delete(deleteResource);

export default router;

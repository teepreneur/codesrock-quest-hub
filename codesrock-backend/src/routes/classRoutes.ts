import { Router } from 'express';
import * as classController from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Class routes. Rosters, lessons and progress live under /api/tracking.
router.route('/')
  .get(classController.getTeacherClasses)
  .post(authorize('super_admin', 'school_admin', 'teacher'), classController.createClass);

export default router;

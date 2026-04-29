import { Router } from 'express';
import * as classController from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// Class routes
router.route('/')
  .get(classController.getTeacherClasses)
  .post(authorize('super_admin', 'school_admin', 'teacher'), classController.createClass);

router.route('/:classId/students')
  .get(authorize('super_admin', 'school_admin', 'teacher'), classController.getClassStudents)
  .post(authorize('super_admin', 'school_admin', 'teacher'), classController.addStudentToClass);

router.post('/:classId/batch-enroll', authorize('super_admin', 'school_admin', 'teacher'), classController.batchEnrollStudents);
router.post('/:classId/enroll-email', authorize('super_admin', 'school_admin', 'teacher'), classController.enrollStudentByEmail);

export default router;

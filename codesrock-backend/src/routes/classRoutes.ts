import { Router } from 'express';
import * as classController from '../controllers/classController';
// Assuming authMiddleware exists based on project structure
// import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Temporarily leaving unprotected for testing, should add protect middleware later
router.route('/')
  .get(classController.getTeacherClasses)
  .post(classController.createClass);

router.route('/:classId/students')
  .get(classController.getClassStudents)
  .post(classController.addStudentToClass);

router.post('/:classId/batch-enroll', classController.batchEnrollStudents);
router.post('/:classId/enroll-email', classController.enrollStudentByEmail);

export default router;

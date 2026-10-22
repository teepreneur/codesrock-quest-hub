import { Router } from 'express';
import { body, param } from 'express-validator';
import * as tracking from '../controllers/trackingController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { validate } from '../middleware/validator';

const router = Router();

const classIdParam = param('classId').isUUID().withMessage('Invalid class ID');
const learnerIdParam = param('learnerId').isUUID().withMessage('Invalid child ID');
const sessionIdParam = param('sessionId').isUUID().withMessage('Invalid lesson ID');

const nameRules = (required: boolean) => [
  (required ? body('firstName') : body('firstName').optional())
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required (max 50 characters)'),
  body('lastName').optional().isString().trim().isLength({ max: 50 }).withMessage('Last name is too long'),
];

const lessonRules = [
  body('date').isISO8601({ strict: true }).withMessage('Lesson date must be a valid date'),
  body('notes').optional({ nullable: true }).isString(),
  body('activityIds').isArray({ min: 1, max: 150 }).withMessage('Choose at least one activity'),
  body('activityIds.*').isUUID(),
  body('attendance').isArray({ max: 200 }),
  body('attendance.*.learnerId').isUUID(),
  body('attendance.*.present').isBoolean(),
  body('results').isArray({ max: 20000 }),
  body('results.*.learnerId').isUUID(),
  body('results.*.activityId').isUUID(),
  body('results.*.mode').isIn(['practical', 'book']),
  body('results.*.level').isInt({ min: 1, max: 3 }),
];

router.use(protect);

// Admin overview (super admin: all schools; school admin: own school)
router.get('/overview', requireAdmin, tracking.getOverview);

// The signed-in teacher's classes at a glance (dashboard)
router.get('/my-classes', tracking.getMyClasses);

// Curriculum for a class
router.get('/classes/:classId/curriculum', validate([classIdParam]), tracking.getClassCurriculum);

// Roster
router.get('/classes/:classId/learners', validate([classIdParam]), tracking.listLearners);
router.post('/classes/:classId/learners', validate([classIdParam, ...nameRules(true)]), tracking.addLearner);
router.patch('/classes/:classId/learners/:learnerId', validate([classIdParam, learnerIdParam, ...nameRules(false)]), tracking.updateLearner);
router.delete('/classes/:classId/learners/:learnerId', validate([classIdParam, learnerIdParam]), tracking.removeLearner);

// Lessons
router.get('/classes/:classId/sessions', validate([classIdParam]), tracking.listSessions);
router.post('/classes/:classId/sessions', validate([classIdParam, ...lessonRules]), tracking.createSession);
router.get('/classes/:classId/sessions/:sessionId', validate([classIdParam, sessionIdParam]), tracking.getSession);
router.put('/classes/:classId/sessions/:sessionId', validate([classIdParam, sessionIdParam, ...lessonRules]), tracking.updateSession);
router.delete('/classes/:classId/sessions/:sessionId', validate([classIdParam, sessionIdParam]), tracking.deleteSession);

// Dashboards
router.get('/classes/:classId/progress', validate([classIdParam]), tracking.getClassProgress);
router.get('/classes/:classId/learners/:learnerId/progress', validate([classIdParam, learnerIdParam]), tracking.getLearnerProgress);

export default router;

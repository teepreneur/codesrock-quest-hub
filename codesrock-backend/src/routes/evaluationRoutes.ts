import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllEvaluations,
  getEvaluationById,
  reviewEvaluation,
  getUserEvaluations,
  verifyCertificate,
  getUserCertificates,
} from '../controllers/evaluationController';
import {
  getEvaluationByTopic,
  submitEvaluation as submitNewEvaluation,
  deleteEvaluation,
} from '../controllers/admin/evaluationController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { requireAdmin, requireContentAdmin } from '../middleware/roleAuth';

const router = Router();

/**
 * Validation rules
 */
const evaluationIdParamValidation = [
  param('evaluationId')
    .notEmpty()
    .withMessage('Evaluation ID is required')
    .isUUID()
    .withMessage('Invalid evaluation ID format'),
];

const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

const reviewEvaluationValidation = [
  body('userEvaluationId')
    .notEmpty()
    .withMessage('User evaluation ID is required')
    .isUUID()
    .withMessage('Invalid user evaluation ID format'),
  body('reviewerId')
    .notEmpty()
    .withMessage('Reviewer ID is required')
    .isUUID()
    .withMessage('Invalid reviewer ID format'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be "approved" or "rejected"'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must not exceed 2000 characters'),
];

const submitMasteryValidation = [
  body('evaluationId')
    .notEmpty()
    .withMessage('Evaluation ID is required')
    .isUUID()
    .withMessage('Invalid evaluation ID format'),
  body('answers')
    .isObject()
    .withMessage('Answers must be an object keyed by question ID'),
];

// All routes are protected
router.use(protect);

// Evaluation routes
router.get('/evaluations', getAllEvaluations);
router.get('/evaluations/:evaluationId', validate(evaluationIdParamValidation), getEvaluationById);

// Admin review of an evaluation attempt
router.post('/evaluations/review', requireAdmin, validate(reviewEvaluationValidation), reviewEvaluation);

// Topic evaluation routes (answers are stripped for non-content-admins)
router.get('/evaluations/topic/:topicId', getEvaluationByTopic);
router.delete('/evaluations/:evaluationId', requireContentAdmin, validate(evaluationIdParamValidation), deleteEvaluation);
router.post('/evaluations/submit-mastery', validate(submitMasteryValidation), submitNewEvaluation);
router.get('/evaluations/user/:userId', validate(userIdParamValidation), getUserEvaluations);

// Certificate routes
router.get('/certificates/verify/:certificateNumber', verifyCertificate);
router.get('/certificates/user/:userId', validate(userIdParamValidation), getUserCertificates);

export default router;

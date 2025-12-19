import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllEvaluations,
  getEvaluationById,
  startEvaluation,
  updateEvaluationProgress,
  submitEvaluation,
  reviewEvaluation,
  getUserEvaluations,
  verifyCertificate,
  getUserCertificates,
} from '../controllers/evaluationController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';

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

const startEvaluationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('evaluationId')
    .notEmpty()
    .withMessage('Evaluation ID is required')
    .isUUID()
    .withMessage('Invalid evaluation ID format'),
];

const updateProgressValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('evaluationId')
    .notEmpty()
    .withMessage('Evaluation ID is required')
    .isUUID()
    .withMessage('Invalid evaluation ID format'),
  body('completedItems')
    .isArray()
    .withMessage('Completed items must be an array'),
];

const submitEvaluationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('evaluationId')
    .notEmpty()
    .withMessage('Evaluation ID is required')
    .isUUID()
    .withMessage('Invalid evaluation ID format'),
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

// All routes are protected
router.use(protect);

// Evaluation routes
router.get('/evaluations', getAllEvaluations);
router.get('/evaluations/:evaluationId', validate(evaluationIdParamValidation), getEvaluationById);

// User evaluation routes
router.post('/evaluations/start', validate(startEvaluationValidation), startEvaluation);
router.put('/evaluations/progress', validate(updateProgressValidation), updateEvaluationProgress);
router.post('/evaluations/submit', validate(submitEvaluationValidation), submitEvaluation);
router.post('/evaluations/review', validate(reviewEvaluationValidation), reviewEvaluation);
router.get('/evaluations/user/:userId', validate(userIdParamValidation), getUserEvaluations);

// Certificate routes
router.get('/certificates/verify/:certificateNumber', verifyCertificate);
router.get('/certificates/user/:userId', validate(userIdParamValidation), getUserCertificates);

export default router;

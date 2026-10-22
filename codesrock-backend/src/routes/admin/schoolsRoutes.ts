import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deactivateSchool,
  permanentDeleteSchool,
  getSchoolByCode,
} from '../../controllers/admin/schoolsController';
import { protect } from '../../middleware/auth';
import { requireAdmin, requireSuperAdmin, auditLog } from '../../middleware/roleAuth';
import { validate } from '../../middleware/validator';

const router = Router();

/**
 * Validation rules
 */
const createSchoolValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region must not exceed 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must not exceed 100 characters'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

const updateSchoolValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid school ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region must not exceed 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must not exceed 100 characters'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const schoolIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid school ID'),
];

const schoolCodeValidation = [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('School code is required')
    .matches(/^SCH-[A-Z0-9]{6}$/)
    .withMessage('Invalid school code format'),
];

const listQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),
  query('region')
    .optional()
    .trim(),
  query('district')
    .optional()
    .trim(),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Public route for school code lookup (used during login)
router.get('/code/:code', validate(schoolCodeValidation), getSchoolByCode);

// Protected routes - require an admin role
router.use(protect);
router.use(requireAdmin);

// Get all schools (admin roles; school admins only see their own school)
router.get('/', validate(listQueryValidation), getAllSchools);

// Get school by ID (admin roles; school admins only for their own school)
router.get('/:id', validate(schoolIdValidation), getSchoolById);

// Create school (super_admin only)
router.post('/', requireSuperAdmin, auditLog, validate(createSchoolValidation), createSchool);

// Update school (super_admin only)
router.put('/:id', requireSuperAdmin, auditLog, validate(updateSchoolValidation), updateSchool);

// Deactivate school (super_admin only)
router.delete('/:id', requireSuperAdmin, auditLog, validate(schoolIdValidation), deactivateSchool);

// Permanently delete school (super_admin only - must be deactivated first)
router.delete('/:id/permanent', requireSuperAdmin, auditLog, validate(schoolIdValidation), permanentDeleteSchool);

export default router;

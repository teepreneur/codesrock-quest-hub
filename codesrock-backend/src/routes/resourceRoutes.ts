import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getResources,
  downloadResource,
  rateResource,
  getPopularResources,
  getUserDownloads,
  getResourceById,
} from '../controllers/resourceController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { uploadResource } from '../config/cloudinary';

const router = Router();

/**
 * Validation rules
 */
const resourceIdParamValidation = [
  param('resourceId')
    .notEmpty()
    .withMessage('Resource ID is required')
    .isUUID()
    .withMessage('Invalid resource ID format'),
];

const userIdParamValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

const downloadValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('resourceId')
    .notEmpty()
    .withMessage('Resource ID is required')
    .isUUID()
    .withMessage('Invalid resource ID format'),
];

const rateValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('resourceId')
    .notEmpty()
    .withMessage('Resource ID is required')
    .isUUID()
    .withMessage('Invalid resource ID format'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review must not exceed 1000 characters'),
];

const queryValidation = [
  query('category')
    .optional()
    .isIn(['Lesson Plans', 'Worksheets', 'Projects', 'Guides', 'Templates'])
    .withMessage('Invalid category'),
  query('gradeLevel')
    .optional()
    .isIn(['Elementary', 'Middle', 'High', 'All'])
    .withMessage('Invalid grade level'),
  query('fileType')
    .optional()
    .isIn(['PDF', 'DOC', 'DOCX', 'ZIP', 'PPT', 'PPTX'])
    .withMessage('Invalid file type'),
  query('userId')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// All routes are protected
router.use(protect);

// Resource routes
router.get('/resources', validate(queryValidation), getResources);
router.get('/resources/popular', getPopularResources);
router.get('/resources/:resourceId', validate(resourceIdParamValidation), getResourceById);

// Download and interaction routes
router.post('/resources/download', validate(downloadValidation), downloadResource);
router.post('/resources/rate', validate(rateValidation), rateResource);

// User downloads route
router.get('/resources/downloads/:userId', validate(userIdParamValidation), getUserDownloads);

// File upload route (Cloudinary)
router.post('/resources/upload', uploadResource.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Cloudinary file info
    const cloudinaryFile = req.file as any; // Cloudinary adds extra properties

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        cloudinaryUrl: cloudinaryFile.path,
        cloudinaryPublicId: cloudinaryFile.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
});

export default router;

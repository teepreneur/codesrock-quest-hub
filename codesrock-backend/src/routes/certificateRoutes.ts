import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getUserCertificates, getCertificateById, downloadCertificatePDF } from '../controllers/certificateController';

const router = Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/certificates/:id/pdf
 * @desc    Generate & download certificate PDF
 * @access  Private
 */
router.get('/:id/pdf', downloadCertificatePDF);

/**
 * @route   GET /api/certificates/detail/:id
 * @desc    Get certificate by ID
 * @access  Private
 */
router.get('/detail/:id', getCertificateById);

/**
 * @route   GET /api/certificates/user/:userId or /api/certificates/:userId
 * @desc    Get all certificates for a user
 * @access  Private
 */
router.get('/user/:userId', getUserCertificates);
router.get('/:userId', getUserCertificates);

export default router;

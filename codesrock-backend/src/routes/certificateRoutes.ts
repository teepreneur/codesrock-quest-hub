import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getUserCertificates, getCertificateById } from '../controllers/certificateController';

const router = Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/certificates/:userId
 * @desc    Get all certificates for a user
 * @access  Private
 */
router.get('/:userId', getUserCertificates);

/**
 * @route   GET /api/certificates/detail/:id
 * @desc    Get certificate by ID
 * @access  Private
 */
router.get('/detail/:id', getCertificateById);

export default router;

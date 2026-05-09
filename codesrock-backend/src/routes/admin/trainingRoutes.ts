import { Router } from 'express';
import { createTrainingSession, updateTrainingSession, deleteTrainingSession } from '../../controllers/admin/trainingController';
import { protect, adminOnly } from '../../middleware/auth';

const router = Router();

// All routes are protected and admin only
router.use(protect);
router.use(adminOnly);

/**
 * @route   POST /api/admin/training
 * @desc    Create a new training session
 * @access  Private/Admin
 */
router.post('/', createTrainingSession);

/**
 * @route   PUT /api/admin/training/:id
 * @desc    Update a training session
 * @access  Private/Admin
 */
router.put('/:id', updateTrainingSession);

/**
 * @route   DELETE /api/admin/training/:id
 * @desc    Delete a training session
 * @access  Private/Admin
 */
router.delete('/:id', deleteTrainingSession);

export default router;

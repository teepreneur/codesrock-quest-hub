import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserStats,
} from '../../controllers/admin/usersController';
import { protect } from '../../middleware/auth';
import { requireAdmin, auditLog } from '../../middleware/roleAuth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);
router.use(auditLog);

// User routes
router.route('/').get(getAllUsers).post(createUser);

router.route('/stats').get(getUserStats);

router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/reset-password').post(resetUserPassword);

export default router;

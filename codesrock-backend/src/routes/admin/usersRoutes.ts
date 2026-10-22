import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserStats,
  searchUsersByContact,
  pairUserWithSchool,
} from '../../controllers/admin/usersController';
import { protect } from '../../middleware/auth';
import { requireAdmin, auditLog, guardUserManagement } from '../../middleware/roleAuth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);
router.use(auditLog);

// User routes
router.route('/').get(getAllUsers).post(guardUserManagement, createUser);

router.route('/stats').get(getUserStats);
router.route('/search').get(searchUsersByContact);

router.route('/:id/pair-school').post(guardUserManagement, pairUserWithSchool);

router
  .route('/:id')
  .get(guardUserManagement, getUserById)
  .put(guardUserManagement, updateUser)
  .delete(guardUserManagement, deleteUser);

router.route('/:id/reset-password').post(guardUserManagement, resetUserPassword);

export default router;

import express from 'express';
import {
  register,
  login,
  getMe,
  getAllStaff,
  getAllUsers,
  updateUserStatus,
  updateUserRole
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public authentication
router.post('/login', login);

// Authenticated user profile
router.get('/me', protect, getMe);
router.get('/staff', protect, getAllStaff);

// ADMIN ONLY User Management
router.post('/register', protect, authorize('ADMIN'), register);
router.get('/users', protect, authorize('ADMIN'), getAllUsers);
router.patch('/users/:id/status', protect, authorize('ADMIN'), updateUserStatus);
router.patch('/users/:id/role', protect, authorize('ADMIN'), updateUserRole);

export default router;

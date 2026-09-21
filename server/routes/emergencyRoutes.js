import express from 'express';
import {
  getEmergencies,
  acknowledgeEmergency,
  resolveEmergency
} from '../controllers/emergencyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getEmergencies);
router.patch('/:id/acknowledge', protect, acknowledgeEmergency);
router.patch('/:id/resolve', protect, resolveEmergency);

export default router;

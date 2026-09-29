import express from 'express';
import { getWardAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ADMIN (system stats) and DOCTOR (clinical ward intel) can view analytics (Nurse forbidden)
router.get('/', protect, authorize('ADMIN', 'DOCTOR'), getWardAnalytics);

export default router;

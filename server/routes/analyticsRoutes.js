import express from 'express';
import { getWardAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getWardAnalytics);

export default router;

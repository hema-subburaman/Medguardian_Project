import express from 'express';
import {
  getDashboardStats,
  getStatusDistribution,
  getDiseaseDistribution,
  getDailyEmergencies,
  getRecentActivity
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/status-distribution', protect, getStatusDistribution);
router.get('/disease-distribution', protect, getDiseaseDistribution);
router.get('/daily-emergencies', protect, getDailyEmergencies);
router.get('/recent-activity', protect, getRecentActivity);

export default router;

import express from 'express';
import { getPatientHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/patient/:id', protect, getPatientHistory);

export default router;

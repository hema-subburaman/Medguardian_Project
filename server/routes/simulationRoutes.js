import express from 'express';
import { getStatus, toggleSimulator, changeScenario, triggerTick } from '../controllers/simulationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', protect, getStatus);
router.post('/toggle', protect, toggleSimulator);
router.post('/mode', protect, changeScenario);
router.post('/tick', protect, triggerTick);

export default router;

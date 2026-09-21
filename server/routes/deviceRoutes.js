import express from 'express';
import { getDevices, registerDevice, linkDeviceToPatient } from '../controllers/deviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getDevices);
router.post('/register', registerDevice);
router.post('/link', protect, linkDeviceToPatient);

export default router;

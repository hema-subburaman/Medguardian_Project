import express from 'express';
import { getDevices, registerDevice, linkDeviceToPatient } from '../controllers/deviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ADMIN and DOCTOR can view devices fleet (Nurse forbidden from device management)
router.get('/', protect, authorize('ADMIN', 'DOCTOR'), getDevices);

// Only ADMIN can register new ESP32 hardware devices
router.post('/register', protect, authorize('ADMIN'), registerDevice);

// Only ADMIN can assign/link devices to patients
router.post('/link', protect, authorize('ADMIN'), linkDeviceToPatient);

export default router;

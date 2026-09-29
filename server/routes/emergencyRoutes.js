import express from 'express';
import {
  getEmergencies,
  acknowledgeEmergency,
  addObservation,
  escalateEmergency,
  resolveEmergency
} from '../controllers/emergencyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All staff can view emergency alerts & audit trail
router.get('/', protect, getEmergencies);

// Only Clinical Staff (DOCTOR, NURSE) may acknowledge emergencies (Admin is forbidden)
router.patch('/:id/acknowledge', protect, authorize('DOCTOR', 'NURSE'), acknowledgeEmergency);

// Clinical bedside observations recorded by NURSE or DOCTOR
router.post('/:id/observation', protect, authorize('DOCTOR', 'NURSE'), addObservation);

// NURSE escalates emergency to on-call Doctor
router.patch('/:id/escalate', protect, authorize('NURSE'), escalateEmergency);

// ONLY DOCTOR has the clinical authority to resolve/finalize emergencies
router.patch('/:id/resolve', protect, authorize('DOCTOR'), resolveEmergency);

export default router;

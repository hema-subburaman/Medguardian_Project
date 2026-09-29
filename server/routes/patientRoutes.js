import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getPatients)
  // Only DOCTOR can create/admit patients with clinical diagnosis
  .post(protect, authorize('DOCTOR'), createPatient);

router.route('/:id')
  .get(protect, getPatientById)
  // Only DOCTOR can update medical info & diagnoses (Admin & Nurse forbidden)
  .put(protect, authorize('DOCTOR'), updatePatient)
  // Only DOCTOR can discharge/remove clinical patient records (Nurse & Admin forbidden)
  .delete(protect, authorize('DOCTOR'), deletePatient);

export default router;

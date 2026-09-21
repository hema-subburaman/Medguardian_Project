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
  .post(protect, authorize('ADMIN', 'DOCTOR', 'NURSE'), createPatient);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, authorize('ADMIN', 'DOCTOR', 'NURSE'), updatePatient)
  .delete(protect, authorize('ADMIN'), deletePatient);

export default router;

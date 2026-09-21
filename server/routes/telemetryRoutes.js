import express from 'express';
import { ingestTelemetry, getPatientTelemetry } from '../controllers/telemetryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ESP32 posts here directly without Bearer token (hardware device API)
router.post('/', ingestTelemetry);
router.get('/patient/:patientId', protect, getPatientTelemetry);

export default router;

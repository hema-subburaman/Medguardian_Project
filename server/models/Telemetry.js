import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  heartRate: { type: Number, required: true },
  spo2: { type: Number, required: true },
  temperature: { type: Number, required: true }, // Celsius standard
  humidity: { type: Number, default: 50 },
  accelX: { type: Number, default: 0 },
  accelY: { type: Number, default: 0 },
  accelZ: { type: Number, default: 1.0 },
  gyroX: { type: Number, default: 0 },
  gyroY: { type: Number, default: 0 },
  gyroZ: { type: Number, default: 0 },
  accelMagnitude: { type: Number, default: 1.0 },
  motionState: { type: String, default: 'Stable' },
  fallDetected: { type: Boolean, default: false },
  sosPressed: { type: Boolean, default: false },
  riskLevel: { type: String, enum: ['NORMAL', 'WARNING', 'HIGH'], default: 'NORMAL' },
  riskScore: { type: Number, default: 10 },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Compound index for time-series queries
telemetrySchema.index({ patientId: 1, timestamp: -1 });

export default mongoose.model('Telemetry', telemetrySchema);

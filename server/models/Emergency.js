import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  device: { type: String, default: 'ESP32-MED-01' },
  type: {
    type: String,
    enum: ['SOS_BUTTON', 'FALL_DETECTED', 'CRITICAL_VITALS', 'ABNORMAL_HEART_RATE', 'ABNORMAL_SPO2', 'FEVER_HIGH'],
    required: true
  },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['NORMAL', 'WARNING', 'HIGH'], default: 'HIGH' },
  message: { type: String, required: true },
  reasons: [{ type: String }],
  recommendation: { type: String, default: 'Immediate medical inspection required' },
  vitalsSnapshot: {
    heartRate: Number,
    spo2: Number,
    temperature: Number,
    accelMagnitude: Number,
    timestamp: { type: Date, default: Date.now }
  },
  status: { type: String, enum: ['pending', 'acknowledged', 'escalated', 'resolved'], default: 'pending', index: true },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acknowledgedAt: { type: Date, default: null },
  observations: [{
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nurseName: { type: String, default: 'Attending Nurse' },
    observation: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now }
  }],
  escalated: { type: Boolean, default: false },
  escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalatedAt: { type: Date, default: null },
  escalationNotes: { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  resolutionNotes: { type: String, default: '' }
}, { timestamps: true });

emergencySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Emergency', emergencySchema);

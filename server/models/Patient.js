import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true }, // e.g. PT-0001
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 130 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  disease: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  emergencyContact: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relation: { type: String, default: 'Family' }
  },
  admissionDate: { type: Date, default: Date.now },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String, default: null }, // e.g. ESP32-MED-01
  status: { type: String, enum: ['admitted', 'discharged', 'critical_care'], default: 'admitted' },
  vitals: {
    heartRate: { type: Number, default: 75 },
    spo2: { type: Number, default: 98 },
    temperature: { type: Number, default: 36.7 }, // Celsius standard
    bloodPressure: { type: String, default: '120/80' },
    lastUpdated: { type: Date, default: Date.now }
  },
  riskLevel: { type: String, enum: ['NORMAL', 'WARNING', 'HIGH'], default: 'NORMAL' },
  medicalHistory: { type: String, default: 'None recorded' },
  monitoringActive: { type: Boolean, default: true }
}, { timestamps: true });

patientSchema.index({ name: 'text', disease: 'text', patientId: 'text' });

patientSchema.pre('save', async function (next) {
  if (this.patientId) return next();
  const count = await mongoose.model('Patient').countDocuments();
  this.patientId = `PT-${String(count + 1).padStart(4, '0')}`;
  next();
});

export default mongoose.model('Patient', patientSchema);

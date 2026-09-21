import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, trim: true }, // e.g. ESP32-MED-01
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  status: { type: String, enum: ['ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL'], default: 'OFFLINE' },
  firmwareVersion: { type: String, default: '1.0.0-node' },
  lastSeen: { type: Date, default: Date.now },
  ipAddress: { type: String, default: '127.0.0.1' },
  batteryLevel: { type: Number, default: 100 },
  sensors: {
    max30100: { type: Boolean, default: true },
    mpu6050: { type: Boolean, default: true },
    dht11: { type: Boolean, default: true },
    sosButton: { type: Boolean, default: true },
    buzzer: { type: Boolean, default: true }
  },
  alarmActive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);

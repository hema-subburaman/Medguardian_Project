import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. PATIENT_CREATED, EMERGENCY_ACKNOWLEDGED
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performerName: { type: String, default: 'System' },
  targetType: { type: String, default: 'PATIENT' },
  targetId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);

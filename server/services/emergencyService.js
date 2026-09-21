import Emergency from '../models/Emergency.js';
import Patient from '../models/Patient.js';
import Device from '../models/Device.js';
import AuditLog from '../models/AuditLog.js';
import { broadcastEmergency, broadcastDeviceStatus } from '../websocket/socketHandler.js';

export async function processEmergencyTrigger({
  patientId,
  deviceId = 'ESP32-MED-01',
  type,
  severity = 'HIGH',
  riskScore = 90,
  riskLevel = 'HIGH',
  message,
  reasons = [],
  recommendation,
  vitalsSnapshot
}) {
  try {
    // Check if an unresolved pending emergency of the same type was created in last 20 seconds
    const twentySecsAgo = new Date(Date.now() - 20 * 1000);
    const existing = await Emergency.findOne({
      patient: patientId,
      type,
      status: 'pending',
      createdAt: { $gte: twentySecsAgo }
    });

    if (existing) {
      // Update snapshot rather than creating duplicate spam
      existing.vitalsSnapshot = vitalsSnapshot;
      await existing.save();
      return { emergency: existing, created: false };
    }

    const newEmergency = await Emergency.create({
      patient: patientId,
      device: deviceId,
      type,
      severity,
      riskScore,
      riskLevel,
      message,
      reasons,
      recommendation,
      vitalsSnapshot,
      status: 'pending'
    });

    // Populate patient info for immediate UI presentation
    const populated = await Emergency.findById(newEmergency._id).populate('patient', 'name room patientId disease assignedDoctor');

    // Activate hardware buzzer instruction on device record
    await Device.findOneAndUpdate(
      { deviceId },
      { alarmActive: true, status: 'CRITICAL', lastSeen: new Date() }
    );

    // Broadcast via Socket.IO
    broadcastEmergency(populated);
    broadcastDeviceStatus({ deviceId, status: 'CRITICAL', alarmActive: true });

    // Create Audit Log
    await AuditLog.create({
      action: 'EMERGENCY_TRIGGERED',
      targetType: 'EMERGENCY',
      targetId: newEmergency._id.toString(),
      details: { patientId, type, message, riskScore }
    });

    return { emergency: populated, created: true };
  } catch (error) {
    console.error('[Emergency Service Error]:', error);
    return null;
  }
}

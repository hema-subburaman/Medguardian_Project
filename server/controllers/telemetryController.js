import Telemetry from '../models/Telemetry.js';
import Patient from '../models/Patient.js';
import Device from '../models/Device.js';
import { evaluateClinicalRisk } from '../services/aiRiskService.js';
import { analyzeMotion } from '../services/fallDetectorService.js';
import { processEmergencyTrigger } from '../services/emergencyService.js';
import { broadcastTelemetry, broadcastPatientUpdate } from '../websocket/socketHandler.js';

export const ingestTelemetry = async (req, res, next) => {
  try {
    const {
      device_id,
      deviceId = device_id,
      patient_id,
      patientId = patient_id,
      heart_rate,
      heartRate = heart_rate,
      spo2,
      temperature,
      humidity = 50,
      accel_x = 0,
      accelX = accel_x,
      accel_y = 0,
      accelY = accel_y,
      accel_z = 1.0,
      accelZ = accel_z,
      gyro_x = 0,
      gyroX = gyro_x,
      gyro_y = 0,
      gyroY = gyro_y,
      gyro_z = 0,
      gyroZ = gyro_z,
      sos_pressed = false,
      sosPressed = sos_pressed,
      fall_detected = false,
      fallDetected = fall_detected
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'Missing device identifier (deviceId)' });
    }

    // 1. Locate the device first
const deviceRecord = await Device.findOne({ deviceId }).populate('patientId');

if (!deviceRecord) {
  return res.status(404).json({
    success: false,
    message: `Device ${deviceId} is not registered`
  });
}

// 2. Patient must be assigned to this device
let patient = deviceRecord.patientId;

if (!patient) {
  return res.status(409).json({
    success: false,
    message: `Device ${deviceId} is not assigned to any patient`
  });
}

// 3. Make sure the patient is currently admitted/under monitoring
if (!['admitted', 'critical_care'].includes(patient.status)) {
  return res.status(409).json({
    success: false,
    message: `Patient ${patient.patientId} is not currently under monitoring`
  });
}

    // 2. Analyze MPU6050 Motion & Fall Detection
    const motion = analyzeMotion({
      accelX: parseFloat(accelX),
      accelY: parseFloat(accelY),
      accelZ: parseFloat(accelZ),
      gyroX: parseFloat(gyroX),
      gyroY: parseFloat(gyroY),
      gyroZ: parseFloat(gyroZ)
    });

    const isFall = Boolean(fallDetected || motion.isFall);
    const isSos = Boolean(sosPressed);

    // 3. Evaluate Clinical Risk via Explainable AI Engine
    const hr = parseFloat(heartRate) || 0;
    const ox = parseFloat(spo2) || 0;
    const tempC = parseFloat(temperature) || 0;

    const aiRisk = evaluateClinicalRisk({
      heartRate: hr,
      spo2: ox,
      temperature: tempC,
      sosPressed: isSos,
      fallDetected: isFall
    });

    // 4. Update Device status & lastSeen
    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        status: aiRisk.riskLevel === 'HIGH' ? 'CRITICAL' : 'ONLINE',
        lastSeen: new Date(),
        ipAddress: req.ip || '127.0.0.1'
      },
      { upsert: true, new: true }
    );

    let alarmShouldSound = false;

    // 5. Update Patient cache & trigger emergencies
    if (patient) {
      patient.vitals = {
  heartRate: Math.round(hr),
  spo2: Math.round(ox),
  temperature: parseFloat(tempC.toFixed(1)),
  bloodPressure: patient.vitals?.bloodPressure || '120/80',
  lastUpdated: new Date()
};
      patient.riskLevel = aiRisk.riskLevel;
      await patient.save();

      // Emergency automation
      if (isSos) {
        alarmShouldSound = true;
        await processEmergencyTrigger({
          patientId: patient._id,
          deviceId,
          type: 'SOS_BUTTON',
          severity: 'CRITICAL',
          riskScore: 100,
          riskLevel: 'HIGH',
          message: 'Patient activated ESP32 SOS emergency button',
          reasons: aiRisk.reasons,
          recommendation: aiRisk.recommendation,
          vitalsSnapshot: { heartRate: hr, spo2: ox, temperature: tempC, accelMagnitude: motion.accelMagnitude }
        });
      } else if (isFall) {
        alarmShouldSound = true;
        await processEmergencyTrigger({
          patientId: patient._id,
          deviceId,
          type: 'FALL_DETECTED',
          severity: 'CRITICAL',
          riskScore: 96,
          riskLevel: 'HIGH',
          message: motion.description,
          reasons: aiRisk.reasons,
          recommendation: aiRisk.recommendation,
          vitalsSnapshot: { heartRate: hr, spo2: ox, temperature: tempC, accelMagnitude: motion.accelMagnitude }
        });
      } else if (aiRisk.riskLevel === 'HIGH') {
        alarmShouldSound = true;
        await processEmergencyTrigger({
          patientId: patient._id,
          deviceId,
          type: 'CRITICAL_VITALS',
          severity: 'HIGH',
          riskScore: aiRisk.riskScore,
          riskLevel: 'HIGH',
          message: 'Clinical AI detected high-risk physiological vitals',
          reasons: aiRisk.reasons,
          recommendation: aiRisk.recommendation,
          vitalsSnapshot: { heartRate: hr, spo2: ox, temperature: tempC, accelMagnitude: motion.accelMagnitude }
        });
      }

      // Save Telemetry in MongoDB
      await Telemetry.create({
        deviceId,
        patientId: patient._id,
        heartRate: hr,
        spo2: ox,
        temperature: tempC,
        humidity: parseFloat(humidity) || 50,
        accelX: parseFloat(accelX),
        accelY: parseFloat(accelY),
        accelZ: parseFloat(accelZ),
        gyroX: parseFloat(gyroX),
        gyroY: parseFloat(gyroY),
        gyroZ: parseFloat(gyroZ),
        accelMagnitude: motion.accelMagnitude,
        motionState: motion.motionState,
        fallDetected: isFall,
        sosPressed: isSos,
        riskLevel: aiRisk.riskLevel,
        riskScore: aiRisk.riskScore,
        timestamp: new Date()
      });

      // Broadcast live to connected React dashboards
      broadcastTelemetry({
        patientId: patient._id.toString(),
        deviceId,
        vitals: patient.vitals,
        aiRisk,
        motion,
        timestamp: new Date()
      });

      broadcastPatientUpdate({
        _id: patient._id.toString(),
        name: patient.name,
        patientId: patient.patientId,
        room: patient.room,
        vitals: patient.vitals,
        riskLevel: patient.riskLevel
      });
    }

    // Return response to ESP32 (including buzzer alarm activation feedback)
    res.status(200).json({
      success: true,
      deviceId,
      riskLevel: aiRisk.riskLevel,
      riskScore: aiRisk.riskScore,
      alarm: alarmShouldSound || device.alarmActive,
      duration: 5000,
      message: 'Telemetry received and processed by MedGuardian Node.js backend'
    });

  } catch (error) {
    next(error);
  }
};

export const getPatientTelemetry = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const data = await Telemetry.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ success: true, count: data.length, data: data.reverse() });
  } catch (error) {
    next(error);
  }
};

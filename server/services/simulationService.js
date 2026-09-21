import Patient from '../models/Patient.js';
import Device from '../models/Device.js';
import Telemetry from '../models/Telemetry.js';
import { evaluateClinicalRisk } from './aiRiskService.js';
import { analyzeMotion } from './fallDetectorService.js';
import { processEmergencyTrigger } from './emergencyService.js';
import { broadcastTelemetry, broadcastPatientUpdate } from '../websocket/socketHandler.js';

let simulationInterval = null;
let simulationState = {
  active: false,
  mode: 'NORMAL', // NORMAL, WARNING, HIGH, FALL, SOS
  step: 0
};

export function getSimulationState() {
  return simulationState;
}

export function setSimulationMode(mode) {
  simulationState.mode = mode;
  console.log(`[Simulator] Mode changed to: ${mode}`);
  return simulationState;
}

export async function runSimulationTick() {
  try {
    const patient = await Patient.findOne({ status: 'admitted', deviceId: { $ne: null } }) || await Patient.findOne({ status: 'admitted' });
    if (!patient) return;

    simulationState.step++;
    const t = simulationState.step * 0.2;

    let heartRate = 72 + Math.sin(t) * 6;
    let spo2 = 98 - Math.abs(Math.cos(t * 0.5)) * 1.5;
    let temperature = 36.7 + Math.sin(t * 0.3) * 0.2;
    let accelX = Math.sin(t) * 0.08;
    let accelY = Math.cos(t) * 0.08;
    let accelZ = 0.98;
    let gyroX = 0;
    let gyroY = 0;
    let gyroZ = 0;
    let sosPressed = false;
    let fallDetected = false;

    // Apply simulation scenario overrides
    if (simulationState.mode === 'WARNING') {
      heartRate = 108 + Math.sin(t) * 4;
      spo2 = 92 - Math.abs(Math.sin(t)) * 1;
      temperature = 37.8;
    } else if (simulationState.mode === 'HIGH') {
      heartRate = 132 + Math.sin(t) * 8;
      spo2 = 86 - Math.abs(Math.cos(t)) * 2;
      temperature = 38.6;
    } else if (simulationState.mode === 'FALL') {
      accelX = 2.1;
      accelY = 1.6;
      accelZ = 2.8;
      gyroX = 140;
      fallDetected = true;
    } else if (simulationState.mode === 'SOS') {
      sosPressed = true;
    }

    const motion = analyzeMotion({ accelX, accelY, accelZ, gyroX, gyroY, gyroZ });
    if (motion.isFall) fallDetected = true;

    const aiRisk = evaluateClinicalRisk({
      heartRate,
      spo2,
      temperature,
      sosPressed,
      fallDetected
    });

    const deviceId = patient.deviceId || 'ESP32-SIM-01';

    // Update patient vitals cache
    patient.vitals = {
      heartRate: Math.round(heartRate),
      spo2: Math.round(spo2),
      temperature: parseFloat(temperature.toFixed(1)),
      bloodPressure: simulationState.mode === 'HIGH' ? '155/98' : '120/80',
      lastUpdated: new Date()
    };
    patient.riskLevel = aiRisk.riskLevel;
    await patient.save();

    // Save telemetry log
    const telemetry = await Telemetry.create({
      deviceId,
      patientId: patient._id,
      heartRate: Math.round(heartRate),
      spo2: Math.round(spo2),
      temperature: parseFloat(temperature.toFixed(1)),
      humidity: 52,
      accelX,
      accelY,
      accelZ,
      gyroX,
      gyroY,
      gyroZ,
      accelMagnitude: motion.accelMagnitude,
      motionState: motion.motionState,
      fallDetected,
      sosPressed,
      riskLevel: aiRisk.riskLevel,
      riskScore: aiRisk.riskScore,
      timestamp: new Date()
    });

    // Check emergency creation
    if (sosPressed) {
      await processEmergencyTrigger({
        patientId: patient._id,
        deviceId,
        type: 'SOS_BUTTON',
        severity: 'CRITICAL',
        riskScore: 100,
        riskLevel: 'HIGH',
        message: 'Patient triggered SOS emergency button',
        reasons: aiRisk.reasons,
        recommendation: aiRisk.recommendation,
        vitalsSnapshot: { heartRate, spo2, temperature, accelMagnitude: motion.accelMagnitude }
      });
      // Reset scenario back to normal after trigger
      simulationState.mode = 'NORMAL';
    } else if (fallDetected) {
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
        vitalsSnapshot: { heartRate, spo2, temperature, accelMagnitude: motion.accelMagnitude }
      });
      simulationState.mode = 'NORMAL';
    } else if (aiRisk.riskLevel === 'HIGH') {
      await processEmergencyTrigger({
        patientId: patient._id,
        deviceId,
        type: 'CRITICAL_VITALS',
        severity: 'HIGH',
        riskScore: aiRisk.riskScore,
        riskLevel: 'HIGH',
        message: 'Critical physiological vitals detected by AI Clinical Engine',
        reasons: aiRisk.reasons,
        recommendation: aiRisk.recommendation,
        vitalsSnapshot: { heartRate, spo2, temperature, accelMagnitude: motion.accelMagnitude }
      });
    }

    // Broadcast live telemetry & patient status
    broadcastTelemetry({
      patientId: patient._id.toString(),
      deviceId,
      vitals: patient.vitals,
      aiRisk,
      motion,
      isSimulated: true,
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

  } catch (err) {
    console.error('[Simulation Tick Error]:', err.message);
  }
}

export function startSimulation(intervalMs = 2000) {
  if (simulationInterval) clearInterval(simulationInterval);
  simulationState.active = true;
  simulationInterval = setInterval(runSimulationTick, intervalMs);
  console.log(`[Simulation Service] Started with interval ${intervalMs}ms`);
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  simulationState.active = false;
  console.log('[Simulation Service] Stopped');
}

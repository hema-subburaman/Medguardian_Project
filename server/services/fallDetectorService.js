/**
 * MedGuardian Fall Detection Engine
 * Evaluates MPU6050 3-Axis Accelerometer & Gyroscope Telemetry
 */

const FALL_THRESHOLDS = {
  IMPACT_G: 2.5,        // Acceleration spike >= 2.5g indicates high-impact fall
  FREE_FALL_G: 0.5,     // Acceleration drop <= 0.5g indicates free-fall drop
  ROTATION_DPS: 120.0   // High angular velocity rotation during fall
};

export function computeAccelerationMagnitude(ax = 0, ay = 0, az = 1.0) {
  return Math.sqrt(ax * ax + ay * ay + az * az);
}

export function computeGyroMagnitude(gx = 0, gy = 0, gz = 0) {
  return Math.sqrt(gx * gx + gy * gy + gz * gz);
}

export function analyzeMotion({
  accelX = 0,
  accelY = 0,
  accelZ = 1.0,
  gyroX = 0,
  gyroY = 0,
  gyroZ = 0
}) {
  const accelMagnitude = computeAccelerationMagnitude(accelX, accelY, accelZ);
  const gyroMagnitude = computeGyroMagnitude(gyroX, gyroY, gyroZ);

  let isFall = false;
  let motionState = 'Stable';
  let description = 'Normal movement pattern';

  if (accelMagnitude >= FALL_THRESHOLDS.IMPACT_G) {
    isFall = true;
    motionState = 'Impact Fall';
    description = `Severe impact detected: ${accelMagnitude.toFixed(2)}g (Threshold: ${FALL_THRESHOLDS.IMPACT_G}g)`;
  } else if (accelMagnitude <= FALL_THRESHOLDS.FREE_FALL_G && gyroMagnitude > FALL_THRESHOLDS.ROTATION_DPS) {
    isFall = true;
    motionState = 'Free Fall';
    description = `Free-fall trajectory detected: ${accelMagnitude.toFixed(2)}g with angular spin ${gyroMagnitude.toFixed(1)}°/s`;
  } else if (accelMagnitude > 1.4 || gyroMagnitude > 80.0) {
    motionState = 'Active Motion';
    description = 'Patient walking or repositioning';
  }

  return {
    isFall,
    accelMagnitude: parseFloat(accelMagnitude.toFixed(2)),
    gyroMagnitude: parseFloat(gyroMagnitude.toFixed(2)),
    motionState,
    description
  };
}

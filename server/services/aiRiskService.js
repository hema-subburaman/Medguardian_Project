/**
 * MedGuardian Authoritative Rule-Based Clinical AI Engine
 * Pure Node.js explainable risk evaluation.
 */

export const RISK_LEVELS = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  HIGH: 'HIGH'
};

export const RISK_COLORS = {
  NORMAL: '#12B76A',  // Clinical Green
  WARNING: '#F79009', // Warning Orange
  HIGH: '#F04438'     // Emergency Red
};

export const STATUS_ICONS = {
  NORMAL: '✅',
  WARNING: '⚠️',
  HIGH: '🚨'
};

export const CLINICAL_THRESHOLDS = {
  HIGH_RISK_HEART_RATE: 120,
  HIGH_RISK_SPO2: 90,
  WARNING_HEART_RATE_MIN: 100,
  WARNING_HEART_RATE_MAX: 120,
  WARNING_SPO2_MIN: 90,
  WARNING_SPO2_MAX: 94,
  FEVER_TEMP_C: 38.0,
  HYPOTHERMIA_TEMP_C: 35.0
};

const RECOMMENDATIONS = {
  NORMAL: 'Vitals are stable. Continue routine healthcare observation.',
  WARNING: 'Borderline clinical metrics detected. Increase monitoring frequency and alert nursing staff if trends persist.',
  HIGH: 'CRITICAL EVENT: Immediate bedside intervention required. Prepare attending physician and emergency response team.'
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

export function evaluateClinicalRisk({
  heartRate = 0,
  spo2 = 0,
  temperature = 0,
  sosPressed = false,
  fallDetected = false
}) {
  const reasons = [];

  // Check physical emergency overrides first
  if (sosPressed) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      riskScore: 100,
      riskColor: RISK_COLORS.HIGH,
      statusIcon: STATUS_ICONS.HIGH,
      reasons: ['🚨 Patient manually pressed the ESP32 Hardware SOS button!'],
      recommendation: 'EMERGENCY: Immediate bedside assistance required. Direct patient SOS triggered.',
      fallRisk: false
    };
  }

  if (fallDetected) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      riskScore: 96,
      riskColor: RISK_COLORS.HIGH,
      statusIcon: STATUS_ICONS.HIGH,
      reasons: ['🚨 Sudden impact & fall pattern detected by MPU6050 accelerometer!'],
      recommendation: 'FALL EMERGENCY: Verify patient consciousness and inspect for physical trauma immediately.',
      fallRisk: true
    };
  }

  // Sensor disconnected or finger detached
  if (heartRate <= 0 || spo2 <= 0) {
    return {
      riskLevel: RISK_LEVELS.NORMAL,
      riskScore: 5,
      riskColor: RISK_COLORS.NORMAL,
      statusIcon: STATUS_ICONS.NORMAL,
      reasons: ['MAX30100 Pulse Oximeter idle or sensor detached from finger'],
      recommendation: 'Verify sensor placement on patient finger for live physiological telemetry.',
      fallRisk: false
    };
  }

  const isCriticalHr = heartRate > CLINICAL_THRESHOLDS.HIGH_RISK_HEART_RATE;
  const isCriticalSpo2 = spo2 < CLINICAL_THRESHOLDS.HIGH_RISK_SPO2;
  const isHighRiskVitals = isCriticalHr && isCriticalSpo2;

  const isWarningHr = heartRate >= CLINICAL_THRESHOLDS.WARNING_HEART_RATE_MIN && heartRate <= CLINICAL_THRESHOLDS.WARNING_HEART_RATE_MAX;
  const isWarningSpo2 = spo2 >= CLINICAL_THRESHOLDS.WARNING_SPO2_MIN && spo2 <= CLINICAL_THRESHOLDS.WARNING_SPO2_MAX;

  let riskLevel = RISK_LEVELS.NORMAL;
  let riskScore = 15;

  if (isHighRiskVitals) {
    riskLevel = RISK_LEVELS.HIGH;
    const hrOver = clamp(heartRate - CLINICAL_THRESHOLDS.HIGH_RISK_HEART_RATE, 0, 30);
    const spo2Under = clamp(CLINICAL_THRESHOLDS.HIGH_RISK_SPO2 - spo2, 0, 15);
    riskScore = Math.round(clamp(75 + (hrOver * 0.5) + (spo2Under * 1.2), 75, 99));

    reasons.push(`Critical Tachycardia: Heart rate ${Math.round(heartRate)} BPM exceeds safety threshold (${CLINICAL_THRESHOLDS.HIGH_RISK_HEART_RATE} BPM)`);
    reasons.push(`Critical Hypoxia: Blood oxygen (SpO₂) ${Math.round(spo2)}% is below safe threshold (${CLINICAL_THRESHOLDS.HIGH_RISK_SPO2}%)`);
  } else if (isCriticalHr || isCriticalSpo2) {
    // Single critical vital also warrants High risk attention
    riskLevel = RISK_LEVELS.HIGH;
    riskScore = isCriticalHr ? 82 : 88;
    if (isCriticalHr) {
      reasons.push(`Severe Tachycardia: Heart rate ${Math.round(heartRate)} BPM > ${CLINICAL_THRESHOLDS.HIGH_RISK_HEART_RATE} BPM`);
    }
    if (isCriticalSpo2) {
      reasons.push(`Severe Hypoxia: Blood oxygen ${Math.round(spo2)}% < ${CLINICAL_THRESHOLDS.HIGH_RISK_SPO2}%`);
    }
  } else if (isWarningHr || isWarningSpo2) {
    riskLevel = RISK_LEVELS.WARNING;
    const bothWarnings = isWarningHr && isWarningSpo2;
    riskScore = bothWarnings ? 62 : 48;

    if (isWarningHr) {
      reasons.push(`Borderline Heart Rate: ${Math.round(heartRate)} BPM is trending into warning zone (${CLINICAL_THRESHOLDS.WARNING_HEART_RATE_MIN}-${CLINICAL_THRESHOLDS.WARNING_HEART_RATE_MAX} BPM)`);
    }
    if (isWarningSpo2) {
      reasons.push(`Borderline Oxygen Saturation: ${Math.round(spo2)}% is suboptimal (${CLINICAL_THRESHOLDS.WARNING_SPO2_MIN}-${CLINICAL_THRESHOLDS.WARNING_SPO2_MAX}%)`);
    }
  } else {
    riskLevel = RISK_LEVELS.NORMAL;
    riskScore = 15;
    reasons.push(`Heart rate (${Math.round(heartRate)} BPM) and SpO₂ (${Math.round(spo2)}%) within normal clinical ranges`);
  }

  // Supplementary temperature observations (DHT11, in Celsius)
  if (temperature > 0) {
    if (temperature >= CLINICAL_THRESHOLDS.FEVER_TEMP_C) {
      reasons.push(`Fever Detected: Body temperature ${temperature.toFixed(1)}°C exceeds ${CLINICAL_THRESHOLDS.FEVER_TEMP_C}°C`);
      if (riskLevel === RISK_LEVELS.NORMAL) {
        riskLevel = RISK_LEVELS.WARNING;
        riskScore = 45;
      }
    } else if (temperature < CLINICAL_THRESHOLDS.HYPOTHERMIA_TEMP_C) {
      reasons.push(`Hypothermia Warning: Body temperature ${temperature.toFixed(1)}°C below safe baseline`);
    }
  }

  return {
    riskLevel,
    riskScore,
    riskColor: RISK_COLORS[riskLevel],
    statusIcon: STATUS_ICONS[riskLevel],
    reasons,
    recommendation: RECOMMENDATIONS[riskLevel],
    fallRisk: fallDetected
  };
}

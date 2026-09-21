import Patient from '../models/Patient.js';
import Telemetry from '../models/Telemetry.js';
import Emergency from '../models/Emergency.js';

export const getPatientHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id).populate('assignedDoctor', 'name email department');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const telemetryRecords = await Telemetry.find({ patientId: patient._id })
      .sort({ timestamp: -1 })
      .limit(60);

    const emergencies = await Emergency.find({ patient: patient._id })
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    const vitalsHistory = telemetryRecords.map(t => ({
      time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heartRate: t.heartRate,
      spo2: t.spo2,
      temperature: t.temperature,
      bloodPressure: patient.vitals?.bloodPressure || '120/80',
      riskLevel: t.riskLevel
    })).reverse();

    // Compute summary metrics
    const hrValues = telemetryRecords.map(t => t.heartRate).filter(v => v > 0);
    const spo2Values = telemetryRecords.map(t => t.spo2).filter(v => v > 0);
    const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : 75;
    const minSpo2 = spo2Values.length ? Math.min(...spo2Values) : 98;

    const summary = {
      avgHeartRate: avgHr,
      minSpo2: minSpo2,
      emergencyCount: emergencies.length,
      currentRisk: patient.riskLevel
    };

    // AI Assessment transitions
    const aiHistory = telemetryRecords.slice(0, 10).map(t => ({
      timestamp: t.timestamp,
      riskLevel: t.riskLevel,
      riskScore: t.riskScore,
      summary: `HR ${t.heartRate} BPM, SpO2 ${t.spo2}%, Temp ${t.temperature}°C`
    }));

    res.json({
      success: true,
      data: {
        patient,
        summary,
        vitalsHistory,
        aiHistory,
        emergencies
      }
    });
  } catch (error) {
    next(error);
  }
};

import Patient from '../models/Patient.js';
import AuditLog from '../models/AuditLog.js';
import { evaluateClinicalRisk } from '../services/aiRiskService.js';
import { broadcastPatientUpdate } from '../websocket/socketHandler.js';

export const getPatients = async (req, res, next) => {
  try {
    const { search, riskLevel, status, gender, bloodGroup } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { disease: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } }
      ];
    }
    if (riskLevel) filter.riskLevel = riskLevel;
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const patients = await Patient.find(filter)
      .populate('assignedDoctor', 'name email department')
      .populate('assignedNurse', 'name email department')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name email department phone')
      .populate('assignedNurse', 'name email department phone');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient clinical record not found' });
    }

    const aiRisk = evaluateClinicalRisk({
      heartRate: patient.vitals?.heartRate || 75,
      spo2: patient.vitals?.spo2 || 98,
      temperature: patient.vitals?.temperature || 36.7
    });

    res.json({
      success: true,
      data: {
        ...patient.toObject(),
        aiRisk
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);

    await AuditLog.create({
      action: 'PATIENT_CREATED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Staff',
      targetType: 'PATIENT',
      targetId: patient._id.toString(),
      details: { name: patient.name, disease: patient.disease, room: patient.room }
    });

    broadcastPatientUpdate(patient);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedDoctor', 'name email').populate('assignedNurse', 'name email');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    await AuditLog.create({
      action: 'PATIENT_UPDATED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Staff',
      targetType: 'PATIENT',
      targetId: patient._id.toString(),
      details: req.body
    });

    broadcastPatientUpdate(patient);
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    await AuditLog.create({
      action: 'PATIENT_DELETED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Admin',
      targetType: 'PATIENT',
      targetId: req.params.id,
      details: { name: patient.name, patientId: patient.patientId }
    });

    res.json({ success: true, message: `Patient ${patient.name} record removed successfully` });
  } catch (error) {
    next(error);
  }
};

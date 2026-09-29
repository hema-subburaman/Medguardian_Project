import Emergency from '../models/Emergency.js';
import Device from '../models/Device.js';
import AuditLog from '../models/AuditLog.js';
import { broadcastEmergencyUpdate } from '../websocket/socketHandler.js';

export const getEmergencies = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const emergencies = await Emergency.find(filter)
      .populate('patient', 'name patientId room disease assignedDoctor emergencyContact')
      .populate('acknowledgedBy', 'name role department')
      .populate('escalatedBy', 'name role department')
      .populate('resolvedBy', 'name role department')
      .populate('observations.recordedBy', 'name role department')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: emergencies.length, data: emergencies });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency alert not found' });

    emergency.status = 'acknowledged';
    emergency.acknowledgedBy = req.user?._id;
    emergency.acknowledgedAt = new Date();
    await emergency.save();

    // Turn off device buzzer once acknowledged
    await Device.findOneAndUpdate({ deviceId: emergency.device }, { alarmActive: false, status: 'WARNING' });

    const populated = await Emergency.findById(emergency._id)
      .populate('patient', 'name patientId room disease')
      .populate('acknowledgedBy', 'name role')
      .populate('escalatedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('observations.recordedBy', 'name role');

    await AuditLog.create({
      action: 'EMERGENCY_ACKNOWLEDGED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Staff',
      targetType: 'EMERGENCY',
      targetId: emergency._id.toString(),
      details: { emergencyId: emergency._id, patient: emergency.patient, role: req.user?.role }
    });

    broadcastEmergencyUpdate(populated);
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const addObservation = async (req, res, next) => {
  try {
    const { observation } = req.body;
    if (!observation || !observation.trim()) {
      return res.status(400).json({ success: false, message: 'Observation text is required' });
    }

    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency alert not found' });

    emergency.observations.push({
      recordedBy: req.user?._id,
      nurseName: req.user?.name || 'Attending Staff',
      observation: observation.trim(),
      recordedAt: new Date()
    });
    await emergency.save();

    const populated = await Emergency.findById(emergency._id)
      .populate('patient', 'name patientId room disease')
      .populate('acknowledgedBy', 'name role')
      .populate('escalatedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('observations.recordedBy', 'name role');

    await AuditLog.create({
      action: 'EMERGENCY_OBSERVATION_RECORDED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Staff',
      targetType: 'EMERGENCY',
      targetId: emergency._id.toString(),
      details: { observation: observation.trim(), role: req.user?.role }
    });

    broadcastEmergencyUpdate(populated);
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const escalateEmergency = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency alert not found' });

    emergency.status = 'escalated';
    emergency.escalated = true;
    emergency.escalatedBy = req.user?._id;
    emergency.escalatedAt = new Date();
    emergency.escalationNotes = notes || 'Bedside nurse escalated emergency for urgent physician intervention';
    await emergency.save();

    const populated = await Emergency.findById(emergency._id)
      .populate('patient', 'name patientId room disease')
      .populate('acknowledgedBy', 'name role')
      .populate('escalatedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('observations.recordedBy', 'name role');

    await AuditLog.create({
      action: 'EMERGENCY_ESCALATED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Nurse',
      targetType: 'EMERGENCY',
      targetId: emergency._id.toString(),
      details: { escalationNotes: emergency.escalationNotes, role: req.user?.role }
    });

    broadcastEmergencyUpdate(populated);
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const resolveEmergency = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency alert not found' });

    emergency.status = 'resolved';
    emergency.resolvedBy = req.user?._id;
    emergency.resolvedAt = new Date();
    emergency.resolutionNotes = notes || 'Clinical resolution verified by attending physician';
    await emergency.save();

    await Device.findOneAndUpdate({ deviceId: emergency.device }, { alarmActive: false, status: 'ONLINE' });

    const populated = await Emergency.findById(emergency._id)
      .populate('patient', 'name patientId room disease')
      .populate('acknowledgedBy', 'name role')
      .populate('escalatedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('observations.recordedBy', 'name role');

    await AuditLog.create({
      action: 'EMERGENCY_RESOLVED',
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Physician',
      targetType: 'EMERGENCY',
      targetId: emergency._id.toString(),
      details: { notes: emergency.resolutionNotes, role: req.user?.role }
    });

    broadcastEmergencyUpdate(populated);
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

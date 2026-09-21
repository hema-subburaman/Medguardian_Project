import Device from '../models/Device.js';
import Patient from '../models/Patient.js';

export const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().populate('patientId', 'name patientId room status').sort({ lastSeen: -1 });
    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
};

export const registerDevice = async (req, res, next) => {
  try {
    const { deviceId, firmwareVersion, ipAddress } = req.body;
    let device = await Device.findOne({ deviceId });

    if (!device) {
      device = await Device.create({
        deviceId,
        firmwareVersion: firmwareVersion || '1.0.0-node',
        ipAddress: ipAddress || req.ip,
        status: 'ONLINE',
        lastSeen: new Date()
      });
    } else {
      device.status = 'ONLINE';
      device.lastSeen = new Date();
      if (ipAddress) device.ipAddress = ipAddress;
      await device.save();
    }

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

export const linkDeviceToPatient = async (req, res, next) => {
  try {
    const { deviceId, patientId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    let device = await Device.findOne({ deviceId });
    if (!device) {
      device = await Device.create({ deviceId, patientId: patient._id, status: 'ONLINE' });
    } else {
      device.patientId = patient._id;
      await device.save();
    }

    patient.deviceId = deviceId;
    await patient.save();

    res.json({ success: true, data: { device, patient } });
  } catch (error) {
    next(error);
  }
};

import api from './api';

export const fetchDevices = async () => {
  const res = await api.get('/devices');
  return res.data.data;
};

export const linkDevice = async (deviceId, patientId) => {
  const res = await api.post('/devices/link', { deviceId, patientId });
  return res.data.data;
};

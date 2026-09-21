import api from './api';

export const fetchEmergencies = async (status = '') => {
  const params = status ? { status } : {};
  const res = await api.get('/emergency', { params });
  return res.data.data;
};

export const acknowledgeEmergency = async (id) => {
  const res = await api.patch(`/emergency/${id}/acknowledge`);
  return res.data.data;
};

export const resolveEmergency = async (id, notes = '') => {
  const res = await api.patch(`/emergency/${id}/resolve`, { notes });
  return res.data.data;
};

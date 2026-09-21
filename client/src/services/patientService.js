import api from './api';

export const fetchPatients = async (params = {}) => {
  const res = await api.get('/patients', { params });
  return res.data.data;
};

export const fetchPatientById = async (id) => {
  const res = await api.get(`/patients/${id}`);
  return res.data.data;
};

export const createPatient = async (patientData) => {
  const res = await api.post('/patients', patientData);
  return res.data.data;
};

export const updatePatient = async (id, patientData) => {
  const res = await api.put(`/patients/${id}`, patientData);
  return res.data.data;
};

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res.data;
};

import api from './api';

export const fetchPatientHistory = async (patientId) => {
  const res = await api.get(`/history/patient/${patientId}`);
  return res.data.data;
};

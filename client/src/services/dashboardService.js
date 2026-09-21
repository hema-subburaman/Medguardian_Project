import api from './api';

export const fetchDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data.data;
};

export const fetchStatusDistribution = async () => {
  const res = await api.get('/dashboard/status-distribution');
  return res.data.data;
};

export const fetchDiseaseDistribution = async () => {
  const res = await api.get('/dashboard/disease-distribution');
  return res.data.data;
};

export const fetchDailyEmergencies = async () => {
  const res = await api.get('/dashboard/daily-emergencies');
  return res.data.data;
};

export const fetchRecentActivity = async () => {
  const res = await api.get('/dashboard/recent-activity');
  return res.data.data;
};

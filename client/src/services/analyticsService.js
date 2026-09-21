import api from './api';

export const fetchWardAnalytics = async () => {
  const res = await api.get('/analytics');
  return res.data.data;
};

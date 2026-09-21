import api from './api';

export const loginUser = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const registerUser = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

export const getStaffList = async () => {
  const res = await api.get('/auth/staff');
  return res.data.data;
};

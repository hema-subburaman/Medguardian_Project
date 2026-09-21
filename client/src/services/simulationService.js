import api from './api';

export const fetchSimulationStatus = async () => {
  const res = await api.get('/simulation/status');
  return res.data.data;
};

export const toggleSimulation = async (active) => {
  const res = await api.post('/simulation/toggle', { active });
  return res.data.data;
};

export const setSimulationMode = async (mode) => {
  const res = await api.post('/simulation/mode', { mode });
  return res.data.data;
};

export const triggerSimulationTick = async () => {
  const res = await api.post('/simulation/tick');
  return res.data.data;
};

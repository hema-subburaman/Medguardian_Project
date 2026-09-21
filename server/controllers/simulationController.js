import {
  getSimulationState,
  setSimulationMode,
  startSimulation,
  stopSimulation,
  runSimulationTick
} from '../services/simulationService.js';

export const getStatus = (req, res) => {
  res.json({ success: true, data: getSimulationState() });
};

export const toggleSimulator = (req, res) => {
  const { active, interval = 2000 } = req.body;
  if (active) {
    startSimulation(interval);
  } else {
    stopSimulation();
  }
  res.json({ success: true, data: getSimulationState() });
};

export const changeScenario = (req, res) => {
  const { mode } = req.body;
  const state = setSimulationMode(mode || 'NORMAL');
  res.json({ success: true, data: state });
};

export const triggerTick = async (req, res, next) => {
  try {
    await runSimulationTick();
    res.json({ success: true, message: 'Simulation tick executed', data: getSimulationState() });
  } catch (err) {
    next(err);
  }
};

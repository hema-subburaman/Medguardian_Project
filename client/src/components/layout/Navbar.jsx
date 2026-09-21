import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMenu,
  FiBell,
  FiZap,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiAlertTriangle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { fetchSimulationStatus, toggleSimulation, setSimulationMode } from '../../services/simulationService';

export default function Navbar({ title = 'Dashboard', onToggleMobileSidebar }) {
  const { user } = useAuth();
  const { unresolvedCount } = useSocket();
  const [simActive, setSimActive] = useState(false);
  const [simMode, setSimMode] = useState('NORMAL');

  useEffect(() => {
    fetchSimulationStatus().then((res) => {
      setSimActive(res?.active || false);
      setSimMode(res?.mode || 'NORMAL');
    }).catch(() => {});
  }, []);

  const handleToggleSim = async () => {
    try {
      const next = !simActive;
      await toggleSimulation(next);
      setSimActive(next);
    } catch (e) {}
  };

  const handleSimScenario = async (mode) => {
    try {
      await setSimulationMode(mode);
      setSimMode(mode);
    } catch (e) {}
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Open sidebar navigation"
        >
          <FiMenu />
        </button>
        <div>
          <h2 className="navbar-page-title">{title}</h2>
          <span className="navbar-breadcrumbs">Hospital Ward / {title}</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Hardware / Simulation Mode Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="sim-indicator-pill"
            onClick={handleToggleSim}
            title="Toggle simulated ESP32 vitals stream for testing"
          >
            <span className="sim-indicator-dot" style={{ backgroundColor: simActive ? 'var(--vital-teal)' : '#94A3B8' }} />
            <span>{simActive ? 'Simulation Mode: ON' : 'Real Hardware (ESP32)'}</span>
            {simActive ? <FiPause style={{ marginLeft: 4 }} /> : <FiPlay style={{ marginLeft: 4 }} />}
          </button>

          {simActive && (
            <select
              value={simMode}
              onChange={(e) => handleSimScenario(e.target.value)}
              className="form-select"
              style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', borderRadius: 'var(--radius-full)' }}
              title="Select simulation test scenario"
            >
              <option value="NORMAL">Scenario: Normal Vitals</option>
              <option value="WARNING">Scenario: Borderline Warning</option>
              <option value="HIGH">Scenario: Critical Tachycardia</option>
              <option value="FALL">Scenario: Fall Impact (2.8g)</option>
              <option value="SOS">Scenario: Patient SOS Trigger</option>
            </select>
          )}
        </div>

        {/* Emergency Alert Indicator */}
        {unresolvedCount > 0 && (
          <Link to="/emergency" className="emergency-alert-pill">
            <FiAlertTriangle />
            <span>{unresolvedCount} ACTIVE EMERGENCY</span>
          </Link>
        )}

        {/* Notification Bell */}
        <Link to="/emergency" className="nav-icon-btn" title="View emergency notifications">
          <FiBell />
          {unresolvedCount > 0 && <span className="nav-badge-count">{unresolvedCount}</span>}
        </Link>
      </div>
    </header>
  );
}

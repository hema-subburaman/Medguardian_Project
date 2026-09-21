import React, { useState, useEffect } from 'react';
import { FiUsers, FiAlertTriangle, FiActivity, FiCpu, FiPlay, FiZap } from 'react-icons/fi';
import MonitoringPatientCard from '../components/monitoring/MonitoringPatientCard';
import LiveVitalsPanel from '../components/monitoring/LiveVitalsPanel';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import { fetchPatients } from '../services/patientService';
import { useSocket } from '../context/SocketContext';
import { setSimulationMode, triggerSimulationTick } from '../services/simulationService';

export default function Monitoring() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientTelemetryMap, setPatientTelemetryMap] = useState({});

  const { latestTelemetry } = useSocket();

  useEffect(() => {
    fetchPatients()
      .then((data) => {
        setPatients(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Update live map when WebSocket emits telemetry
  useEffect(() => {
    if (latestTelemetry && latestTelemetry.patientId) {
      setPatientTelemetryMap((prev) => ({
        ...prev,
        [latestTelemetry.patientId]: latestTelemetry
      }));

      // Also update patient riskLevel in list
      setPatients((prev) =>
        prev.map((p) =>
          p._id === latestTelemetry.patientId
            ? { ...p, vitals: latestTelemetry.vitals, riskLevel: latestTelemetry.aiRisk?.riskLevel || p.riskLevel }
            : p
        )
      );
    }
  }, [latestTelemetry]);

  const selectedPatient = patients.find((p) => p._id === selectedPatientId) || null;
  const liveForSelected = selectedPatient ? patientTelemetryMap[selectedPatient._id] : null;

  const criticalCount = patients.filter((p) => (patientTelemetryMap[p._id]?.aiRisk?.riskLevel || p.riskLevel) === 'HIGH').length;
  const warningCount = patients.filter((p) => (patientTelemetryMap[p._id]?.aiRisk?.riskLevel || p.riskLevel) === 'WARNING').length;

  const handleTriggerScenario = async (mode) => {
    await setSimulationMode(mode);
    await triggerSimulationTick();
  };

  if (loading) {
    return <Loader fullScreen label="Establishing Real-Time IoT Telemetry Stream..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Live Patient Monitoring</h1>
          <p>Real-time continuous physiological and motion telemetry streaming via ESP32 &amp; Socket.IO.</p>
        </div>

        {/* Quick simulation scenario triggers for demonstration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Simulate Scenarios:</span>
          <button className="btn btn-secondary btn-sm" onClick={() => handleTriggerScenario('NORMAL')}>
            Normal
          </button>
          <button className="btn btn-warning btn-sm" onClick={() => handleTriggerScenario('WARNING')}>
            Warning (108 BPM)
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleTriggerScenario('HIGH')}>
            Critical (135 BPM)
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleTriggerScenario('FALL')}>
            🚨 Fall Impact (2.8g)
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleTriggerScenario('SOS')}>
            🚨 Hardware SOS
          </button>
        </div>
      </div>

      {/* Ward Telemetry Stat Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={FiUsers}
          label="Patients Monitored"
          value={patients.length}
          tone="blue"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Critical Risk"
          value={criticalCount}
          tone="critical"
          trend={{ positive: false, label: `${criticalCount} Need Immediate Check` }}
        />
        <StatCard
          icon={FiActivity}
          label="Warning State"
          value={warningCount}
          tone="warning"
        />
      </div>

      {/* Monitored Patient Cards Grid */}
      <div className="monitoring-grid">
        {patients.map((p) => (
          <MonitoringPatientCard
            key={p._id}
            patient={p}
            live={patientTelemetryMap[p._id]}
            onSelect={() => setSelectedPatientId(p._id)}
          />
        ))}
      </div>

      {/* Side Inspection Drawer */}
      <LiveVitalsPanel
        patient={selectedPatient}
        live={liveForSelected}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
}

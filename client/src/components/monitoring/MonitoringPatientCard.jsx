import React from 'react';
import Badge from '../ui/Badge';
import { FiHeart, FiWind, FiThermometer, FiWifi, FiAlertTriangle } from 'react-icons/fi';

export default function MonitoringPatientCard({ patient, live, onSelect }) {
  const currentRisk = live?.aiRisk?.riskLevel || patient.riskLevel || 'NORMAL';
  const hr = live?.vitals?.heartRate ?? patient.vitals?.heartRate ?? 75;
  const spo2 = live?.vitals?.spo2 ?? patient.vitals?.spo2 ?? 98;
  const temp = live?.vitals?.temperature ?? patient.vitals?.temperature ?? 36.7;

  const statusClass = currentRisk === 'HIGH' ? 'status-high' : currentRisk === 'WARNING' ? 'status-warning' : 'status-normal';

  return (
    <div className={`monitored-patient-card ${statusClass}`} onClick={onSelect}>
      <div className="patient-header-row">
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {patient.name}
          </h4>
          <span className="patient-mini-meta">
            {patient.patientId} · Room {patient.room} · {patient.disease}
          </span>
        </div>
        <Badge status={currentRisk} />
      </div>

      <div className="vitals-summary-row">
        <div className="vital-metric-cell">
          <span className="vital-metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiHeart style={{ color: 'var(--status-critical)' }} /> HR
          </span>
          <span className="vital-metric-value" style={{ color: hr > 120 ? 'var(--status-critical)' : 'inherit' }}>
            {hr} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>BPM</span>
          </span>
        </div>

        <div className="vital-metric-cell">
          <span className="vital-metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiWind style={{ color: 'var(--vital-teal)' }} /> SpO₂
          </span>
          <span className="vital-metric-value" style={{ color: spo2 < 90 ? 'var(--status-critical)' : 'inherit' }}>
            {spo2} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
          </span>
        </div>

        <div className="vital-metric-cell">
          <span className="vital-metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiThermometer style={{ color: 'var(--status-warning)' }} /> Temp
          </span>
          <span className="vital-metric-value" style={{ color: temp >= 38 ? 'var(--status-warning)' : 'inherit' }}>
            {temp} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>°C</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FiWifi style={{ color: patient.deviceId ? 'var(--status-normal)' : '#94A3B8' }} />
          <span>{patient.deviceId || 'No Sensor Paired'}</span>
        </span>
        <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Inspect Live Panel &rarr;</span>
      </div>
    </div>
  );
}

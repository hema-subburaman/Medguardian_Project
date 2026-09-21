import React from 'react';
import { FiX, FiHeart, FiWind, FiThermometer, FiActivity, FiZap } from 'react-icons/fi';
import ExplainableAICard from './ExplainableAICard';
import Badge from '../ui/Badge';

export default function LiveVitalsPanel({ patient, live, onClose }) {
  if (!patient) return null;

  const hr = live?.vitals?.heartRate ?? patient.vitals?.heartRate ?? 75;
  const spo2 = live?.vitals?.spo2 ?? patient.vitals?.spo2 ?? 98;
  const temp = live?.vitals?.temperature ?? patient.vitals?.temperature ?? 36.7;
  const bp = live?.vitals?.bloodPressure ?? patient.vitals?.bloodPressure ?? '120/80';
  const aiRisk = live?.aiRisk || {
    riskLevel: patient.riskLevel || 'NORMAL',
    riskScore: 15,
    riskColor: '#12B76A',
    statusIcon: '✅',
    reasons: ['Patient vitals stable.'],
    recommendation: 'Continue regular bedside monitoring.'
  };

  return (
    <div className="live-drawer-overlay" onClick={onClose}>
      <div className="live-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.35rem' }}>
                {patient.name}
              </h3>
              <Badge status={aiRisk.riskLevel} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {patient.patientId} · Room {patient.room} · {patient.disease}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close drawer">
            <FiX />
          </button>
        </div>

        {/* Animated ECG Pulse Line */}
        <div style={{
          backgroundColor: '#0B1528',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--vital-teal)', fontWeight: 600, letterSpacing: '0.05em' }}>
              LIVE SENSOR TELEMETRY (MAX30100 + MPU6050)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#12B76A' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#12B76A', animation: 'pulseGlow 1.2s infinite' }} />
              STREAM ACTIVE
            </span>
          </div>
          <svg viewBox="0 0 500 50" style={{ width: '100%', height: 45, stroke: '#0EA5A4', fill: 'none', strokeWidth: 2 }}>
            <path
              d="M0,25 L100,25 L110,10 L120,40 L130,25 L200,25 L210,5 L225,45 L235,25 L340,25 L350,15 L360,35 L370,25 L500,25"
              strokeDasharray="500"
              style={{ animation: 'ecgPulse 2.8s linear infinite' }}
            />
          </svg>
        </div>

        {/* Digital Vitals Readout Grid */}
        <div className="live-vitals-display-grid">
          <div className="vital-box">
            <div className="vital-box-header">
              <span className="vital-box-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiHeart style={{ color: 'var(--status-critical)' }} /> Heart Rate
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX30100</span>
            </div>
            <div>
              <span className="vital-box-big-val" style={{ color: hr > 120 ? 'var(--status-critical)' : 'inherit' }}>
                {hr}
              </span>
              <span className="vital-box-unit">BPM</span>
            </div>
          </div>

          <div className="vital-box">
            <div className="vital-box-header">
              <span className="vital-box-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiWind style={{ color: 'var(--vital-teal)' }} /> SpO₂ Oxygen
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX30100</span>
            </div>
            <div>
              <span className="vital-box-big-val" style={{ color: spo2 < 90 ? 'var(--status-critical)' : 'inherit' }}>
                {spo2}
              </span>
              <span className="vital-box-unit">%</span>
            </div>
          </div>

          <div className="vital-box">
            <div className="vital-box-header">
              <span className="vital-box-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiThermometer style={{ color: 'var(--status-warning)' }} /> Temperature
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DHT11</span>
            </div>
            <div>
              <span className="vital-box-big-val" style={{ color: temp >= 38 ? 'var(--status-warning)' : 'inherit' }}>
                {temp}
              </span>
              <span className="vital-box-unit">°C</span>
            </div>
          </div>

          <div className="vital-box">
            <div className="vital-box-header">
              <span className="vital-box-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiActivity style={{ color: 'var(--primary-blue)' }} /> Blood Pressure
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIBP</span>
            </div>
            <div>
              <span className="vital-box-big-val" style={{ fontSize: '1.75rem' }}>{bp}</span>
              <span className="vital-box-unit">mmHg</span>
            </div>
          </div>
        </div>

        {/* Explainable AI Card */}
        <ExplainableAICard aiRisk={aiRisk} />
      </div>
    </div>
  );
}

import React from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FiAlertTriangle, FiCheck, FiCheckCircle, FiClock, FiHeart, FiWind, FiThermometer } from 'react-icons/fi';

export default function EmergencyCard({
  emergency,
  onAcknowledge,
  onResolve
}) {
  const isPending = emergency.status === 'pending';
  const isAck = emergency.status === 'acknowledged';
  const isResolved = emergency.status === 'resolved';

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="emergency-card-item">
      <div className="emergency-card-header">
        <div className="emergency-type-badge">
          <FiAlertTriangle />
          <span>{emergency.type.replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Risk Score: <strong>{emergency.riskScore}/100</strong></span>
          <Badge status={emergency.status} />
        </div>
      </div>

      <div>
        <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
          {emergency.patient?.name || 'Unassigned Patient'}
        </h4>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          ID: {emergency.patient?.patientId || 'PT-XXXX'} · Room: {emergency.patient?.room || 'Ward'} · Hardware: {emergency.device}
        </span>
      </div>

      <div className="emergency-reason-text">
        <strong>Trigger Reason:</strong> {emergency.message}
        {emergency.reasons && emergency.reasons.length > 0 && (
          <ul style={{ marginTop: 6, paddingLeft: 16, fontSize: '0.82rem' }}>
            {emergency.reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Snapshot vitals */}
      {emergency.vitalsSnapshot && (
        <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-muted)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiHeart style={{ color: 'var(--status-critical)' }} /> {emergency.vitalsSnapshot.heartRate || '—'} BPM
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiWind style={{ color: 'var(--vital-teal)' }} /> {emergency.vitalsSnapshot.spo2 || '—'}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiThermometer style={{ color: 'var(--status-warning)' }} /> {emergency.vitalsSnapshot.temperature || '—'}°C
          </span>
        </div>
      )}

      {/* Audit timestamps */}
      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div><FiClock style={{ verticalAlign: -1, marginRight: 4 }} /> Triggered: {formatTime(emergency.createdAt)}</div>
        {emergency.acknowledgedAt && (
          <div><FiCheck style={{ verticalAlign: -1, marginRight: 4 }} /> Acknowledged by: {emergency.acknowledgedBy?.name || 'Staff'} ({formatTime(emergency.acknowledgedAt)})</div>
        )}
        {emergency.resolvedAt && (
          <div><FiCheckCircle style={{ verticalAlign: -1, marginRight: 4 }} /> Resolved by: {emergency.resolvedBy?.name || 'Staff'} ({formatTime(emergency.resolvedAt)})</div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {isPending && (
          <Button variant="warning" size="sm" onClick={() => onAcknowledge(emergency._id)}>
            Acknowledge Emergency
          </Button>
        )}
        {(isPending || isAck) && (
          <Button variant="primary" size="sm" onClick={() => onResolve(emergency._id)}>
            Resolve Alert
          </Button>
        )}
      </div>
    </div>
  );
}

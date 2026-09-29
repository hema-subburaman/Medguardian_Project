import React from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiWind,
  FiThermometer,
  FiSend,
  FiEdit3,
  FiShield
} from 'react-icons/fi';

export default function EmergencyCard({
  emergency,
  isAdmin,
  isDoctor,
  isNurse,
  onAcknowledge,
  onAddObservation,
  onEscalate,
  onResolve
}) {
  const isPending = emergency.status === 'pending';
  const isAck = emergency.status === 'acknowledged' || emergency.status === 'escalated';
  const isResolved = emergency.status === 'resolved';

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`;
  };

  const handlePromptObservation = () => {
    const obs = window.prompt('Enter bedside clinical/nursing observation:');
    if (obs && obs.trim()) {
      onAddObservation(emergency._id, obs.trim());
    }
  };

  const handlePromptEscalate = () => {
    const notes = window.prompt('Enter escalation reason / clinical urgency for on-call doctor:');
    if (notes && notes.trim()) {
      onEscalate(emergency._id, notes.trim());
    }
  };

  return (
    <div className="emergency-card-item">
      <div className="emergency-card-header">
        <div className="emergency-type-badge">
          <FiAlertTriangle />
          <span>{emergency.type.replace(/_/g, ' ')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Risk Score: <strong>{emergency.riskScore}/100</strong>
          </span>
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

      {/* Nursing Observations */}
      {emergency.observations && emergency.observations.length > 0 && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(15, 149, 142, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(15, 149, 142, 0.2)' }}>
          <strong style={{ fontSize: '0.8rem', color: 'var(--vital-teal)' }}>Nursing Bedside Observations:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {emergency.observations.map((obs, idx) => (
              <li key={idx}>
                <em>{obs.nurseName || 'Nurse'}:</em> "{obs.observation}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation Alert Banner */}
      {emergency.escalated && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(240, 68, 56, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(240, 68, 56, 0.25)', fontSize: '0.82rem', color: 'var(--status-critical)' }}>
          <strong>🚨 Escalated for Physician Intervention:</strong> {emergency.escalationNotes || 'Urgent evaluation requested by attending nurse'}
        </div>
      )}

      {/* Audit timestamps */}
      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        <div><FiClock style={{ verticalAlign: -1, marginRight: 4 }} /> Triggered: {formatTime(emergency.createdAt)}</div>
        {emergency.acknowledgedAt && (
          <div><FiCheck style={{ verticalAlign: -1, marginRight: 4 }} /> Acknowledged by: {emergency.acknowledgedBy?.name || 'Staff'} ({formatTime(emergency.acknowledgedAt)})</div>
        )}
        {emergency.resolvedAt && (
          <div><FiCheckCircle style={{ verticalAlign: -1, marginRight: 4 }} /> Resolved by: {emergency.resolvedBy?.name || 'Doctor'} ({formatTime(emergency.resolvedAt)})</div>
        )}
        {emergency.resolutionNotes && (
          <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginLeft: 16 }}>"{emergency.resolutionNotes}"</div>
        )}
      </div>

      {/* Role-Based Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
        {isAdmin && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiShield style={{ color: 'var(--primary-blue)' }} /> Administrative Record (Clinical actions restricted to Doctors & Nurses)
          </span>
        )}

        {isNurse && !isResolved && (
          <>
            {isPending && (
              <Button variant="warning" size="sm" onClick={() => onAcknowledge(emergency._id)}>
                Acknowledge Emergency
              </Button>
            )}
            {isAck && (
              <>
                <Button variant="secondary" size="sm" icon={FiEdit3} onClick={handlePromptObservation}>
                  Add Observation
                </Button>
                {!emergency.escalated && (
                  <Button variant="primary" size="sm" icon={FiSend} onClick={handlePromptEscalate}>
                    Escalate to Doctor
                  </Button>
                )}
                <span style={{ fontSize: '0.78rem', color: 'var(--status-warning)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                  <FiClock /> Awaiting Physician Resolution
                </span>
              </>
            )}
          </>
        )}

        {isDoctor && !isResolved && (
          <>
            {isPending && (
              <Button variant="warning" size="sm" onClick={() => onAcknowledge(emergency._id)}>
                Acknowledge Emergency
              </Button>
            )}
            {isAck && (
              <>
                <Button variant="secondary" size="sm" icon={FiEdit3} onClick={handlePromptObservation}>
                  Add Observation
                </Button>
                <Button variant="primary" size="sm" icon={FiCheckCircle} onClick={() => onResolve(emergency._id)}>
                  Resolve Emergency
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

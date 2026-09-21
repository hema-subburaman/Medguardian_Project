import React from 'react';

export default function EmergencyTimeline({ emergencies = [] }) {
  if (emergencies.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No emergency timeline incidents recorded.</p>;
  }

  return (
    <div className="emergency-timeline-list">
      {emergencies.slice(0, 10).map((e) => (
        <div key={e._id} className="timeline-step">
          <div className="timeline-dot" style={{ borderColor: e.status === 'resolved' ? 'var(--status-normal)' : 'var(--status-critical)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {e.patient?.name || 'Patient'} — {e.type.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(e.createdAt).toLocaleString()}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{e.message}</p>
        </div>
      ))}
    </div>
  );
}

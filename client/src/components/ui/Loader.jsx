import React from 'react';
import { FiActivity } from 'react-icons/fi';

export default function Loader({ label = 'Accessing MedGuardian Clinical Stream...', fullScreen = false }) {
  const content = (
    <div className="state-container">
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '4px solid var(--primary-light)',
          borderTopColor: 'var(--primary-blue)',
          animation: 'spin 1s linear infinite'
        }} />
        <FiActivity style={{ fontSize: '1.8rem', color: 'var(--primary-blue)' }} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
        {label}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    );
  }

  return content;
}

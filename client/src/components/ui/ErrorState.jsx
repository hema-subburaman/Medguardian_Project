import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to Load Clinical Data',
  message = 'A network or server communication error occurred.',
  onRetry
}) {
  return (
    <div className="state-container">
      <div className="state-icon" style={{ color: 'var(--status-critical)' }}>
        <FiAlertTriangle />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}

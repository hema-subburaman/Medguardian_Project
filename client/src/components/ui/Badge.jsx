import React from 'react';

export default function Badge({
  children,
  status = 'NORMAL',
  withDot = true,
  className = ''
}) {
  const normStatus = (status || 'NORMAL').toUpperCase();
  let statusClass = 'badge-normal';

  if (normStatus === 'WARNING') statusClass = 'badge-warning';
  if (normStatus === 'HIGH' || normStatus === 'CRITICAL') statusClass = 'badge-critical';
  if (normStatus === 'PENDING') statusClass = 'badge-critical';
  if (normStatus === 'ACKNOWLEDGED') statusClass = 'badge-warning';
  if (normStatus === 'RESOLVED') statusClass = 'badge-normal';
  if (normStatus === 'ONLINE') statusClass = 'badge-normal';
  if (normStatus === 'OFFLINE') statusClass = 'badge-gray';

  return (
    <span className={`badge ${statusClass} ${className}`}>
      {withDot && <span className="badge-dot" />}
      <span>{children || status}</span>
    </span>
  );
}

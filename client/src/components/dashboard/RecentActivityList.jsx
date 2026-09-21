import React from 'react';
import { FiActivity, FiUserPlus, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function RecentActivityList({ items = [] }) {
  if (items.length === 0) {
    return <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No recent ward activity.</p>;
  }

  const getIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('emergency')) return { icon: FiAlertTriangle, color: 'var(--status-critical)', bg: 'var(--status-critical-bg)' };
    if (t.includes('patient')) return { icon: FiUserPlus, color: 'var(--primary-blue)', bg: 'var(--primary-light)' };
    if (t.includes('ack') || t.includes('resolve')) return { icon: FiCheckCircle, color: 'var(--status-normal)', bg: 'var(--status-normal-bg)' };
    return { icon: FiActivity, color: 'var(--vital-teal)', bg: 'var(--vital-teal-light)' };
  };

  return (
    <div className="activity-feed-list">
      {items.map((act) => {
        const { icon: Icon, color, bg } = getIcon(act.title);
        return (
          <div key={act.id} className="activity-item">
            <div className="activity-icon-badge" style={{ backgroundColor: bg, color }}>
              <Icon />
            </div>
            <div className="activity-details">
              <div className="activity-title">{act.title}</div>
              {act.description && <div className="activity-desc">{act.description}</div>}
            </div>
            <div className="activity-time">
              {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

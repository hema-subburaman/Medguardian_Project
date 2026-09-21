import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
  trend
}) {
  const iconToneClass = `stat-icon-${tone}`;

  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${iconToneClass}`}>
        {Icon && <Icon />}
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className={`stat-trend ${trend.positive ? 'positive' : 'negative'}`}>
            {trend.positive ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

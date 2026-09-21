import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmergencyTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No trend data available.</p>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="emergencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F04438" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F04438" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
          />
          <Area
            type="monotone"
            dataKey="emergencies"
            stroke="#F04438"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#emergencyGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

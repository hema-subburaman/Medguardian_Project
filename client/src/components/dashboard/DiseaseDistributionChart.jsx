import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DiseaseDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No disease data.</p>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <XAxis
            dataKey="disease"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
          />
          <Bar dataKey="patients" fill="#2F6BFF" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

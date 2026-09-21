import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function StatusDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No distribution data.</p>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={65}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#2F6BFF'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value, entry) => (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {value}: {entry.payload.value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

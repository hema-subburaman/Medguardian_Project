import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { FiUsers, FiCpu, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import Card from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import Loader from '../components/ui/Loader';
import { fetchWardAnalytics } from '../services/analyticsService';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWardAnalytics()
      .then((res) => setData(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <Loader fullScreen label="Compiling Hospital Ward Analytics..." />;
  }

  const COLORS = ['#2F6BFF', '#0EA5A4', '#F79009', '#F04438', '#8B5CF6'];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Clinical Analytics & Ward Intelligence</h1>
          <p>Ward-wide telemetry metrics, incident distribution, and clinical response efficiency.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-grid">
        <StatCard
          icon={FiUsers}
          label="Total Admitted"
          value={data.totalPatients}
          tone="blue"
        />
        <StatCard
          icon={FiCpu}
          label="IoT Sensor Gateway"
          value={`${data.devicesOnline}/${data.totalDevices}`}
          tone="teal"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Total Emergencies"
          value={data.totalEmergencies}
          tone="critical"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Triage Resolution Rate"
          value={`${data.resolutionRate}%`}
          tone="normal"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="analytics-charts-row">
        <Card title="Emergency Incident Types" subtitle="Classification of triggered medical alarms">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.emergencyDistribution || []}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data.emergencyDistribution || []).map((entry, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Ward Risk Level Distribution" subtitle="Active patient distribution by clinical severity">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={data.riskDistribution || []} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" fill="#2F6BFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

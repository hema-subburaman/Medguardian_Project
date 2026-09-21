import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiHeart, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import StatCard from '../components/dashboard/StatCard';
import StatusDistributionChart from '../components/dashboard/StatusDistributionChart';
import DiseaseDistributionChart from '../components/dashboard/DiseaseDistributionChart';
import EmergencyTrendChart from '../components/dashboard/EmergencyTrendChart';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import {
  fetchDashboardStats,
  fetchStatusDistribution,
  fetchDiseaseDistribution,
  fetchDailyEmergencies,
  fetchRecentActivity
} from '../services/dashboardService';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
  const [emergencyData, setEmergencyData] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        const [s, st, dis, em, act] = await Promise.all([
          fetchDashboardStats(),
          fetchStatusDistribution(),
          fetchDiseaseDistribution(),
          fetchDailyEmergencies(),
          fetchRecentActivity()
        ]);
        if (!mounted) return;
        setStats(s);
        setStatusData(st);
        setDiseaseData(dis);
        setEmergencyData(em);
        setActivity(act);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <Loader fullScreen label="Loading MedGuardian Hospital Ward Overview..." />;
  }

  return (
    <div>
      {/* Top Clinical Stat Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          icon={FiUsers}
          label="Total Patients"
          value={stats?.totalPatients || 0}
          tone="blue"
        />
        <StatCard
          icon={FiUserCheck}
          label="Attending Doctors"
          value={stats?.doctors || 0}
          tone="blue"
        />
        <StatCard
          icon={FiHeart}
          label="Active Nurses"
          value={stats?.nurses || 0}
          tone="teal"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Critical Patients"
          value={stats?.critical || 0}
          tone="critical"
          trend={{
            positive: false,
            label: `${stats?.critical || 0} Need Immediate Attention`
          }}
        />
        <StatCard
          icon={FiAlertCircle}
          label="Warning Patients"
          value={stats?.warning || 0}
          tone="warning"
        />
      </div>

      {/* Clinical Charts Grid */}
      <div className="dashboard-charts-grid">
        <div className="chart-col-4">
          <Card title="Patient Status Distribution" subtitle="Real-time clinical risk across ward beds">
            <StatusDistributionChart data={statusData} />
          </Card>
        </div>

        <div className="chart-col-4">
          <Card title="Disease Categories" subtitle="Active hospitalizations by medical diagnosis">
            <DiseaseDistributionChart data={diseaseData} />
          </Card>
        </div>

        <div className="chart-col-4">
          <Card title="7-Day Emergency Incidents" subtitle="Automated alerts & emergency triggers">
            <EmergencyTrendChart data={emergencyData} />
          </Card>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <Card title="Recent Ward Activity & Audit Trail" subtitle="Admissions, sensor syncs, and emergency responses">
        <RecentActivityList items={activity} />
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import EmergencyCard from '../components/emergency/EmergencyCard';
import EmergencyTimeline from '../components/emergency/EmergencyTimeline';
import {
  fetchEmergencies,
  acknowledgeEmergency,
  addEmergencyObservation,
  escalateEmergency,
  resolveEmergency
} from '../services/emergencyService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { FiShield, FiAlertCircle } from 'react-icons/fi';

export default function EmergencyCenter() {
  const { user, isAdmin, isDoctor, isNurse } = useAuth();
  const [tab, setTab] = useState('pending'); // pending, acknowledged, resolved
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const { emergencies: liveEmergencies } = useSocket();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchEmergencies();
      setEmergencies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update state on real-time alert receipt
  useEffect(() => {
    if (liveEmergencies.length > 0) {
      loadData();
    }
  }, [liveEmergencies]);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeEmergency(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Acknowledgment failed');
    }
  };

  const handleAddObservation = async (id, observation) => {
    try {
      await addEmergencyObservation(id, observation);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record observation');
    }
  };

  const handleEscalate = async (id, notes) => {
    try {
      await escalateEmergency(id, notes);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Escalation failed');
    }
  };

  const handleResolve = async (id) => {
    const notes = window.prompt('Enter clinical resolution notes (e.g. Bedside inspection verified stable):');
    if (notes !== null) {
      try {
        await resolveEmergency(id, notes);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Resolution failed');
      }
    }
  };

  const pendingList = emergencies.filter((e) => e.status === 'pending');
  const ackList = emergencies.filter((e) => e.status === 'acknowledged' || e.status === 'escalated');
  const resolvedList = emergencies.filter((e) => e.status === 'resolved');

  const currentList = tab === 'pending' ? pendingList : tab === 'acknowledged' ? ackList : resolvedList;

  if (loading) {
    return <Loader fullScreen label="Connecting to Hospital Emergency Command Center..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Emergency Command Center</h1>
          <p>Automated clinical triage for Hardware SOS triggers, MPU6050 fall detection, and high-risk vitals.</p>
        </div>
      </div>

      {/* RBAC Notice for Admin */}
      {isAdmin && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: 'rgba(23, 92, 211, 0.08)',
          border: '1px solid rgba(23, 92, 211, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          <FiShield style={{ color: 'var(--primary-blue)', fontSize: '1.25rem', flexShrink: 0 }} />
          <div>
            <strong>Administrative Audit View:</strong> As a Hospital Administrator, you have full audit visibility into clinical emergencies and triage timestamps. Direct clinical actions (acknowledging and resolving emergencies) are reserved for Attending Physicians and Ward Nurses.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="emergency-tabs">
        <button
          className={`emergency-tab-btn ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Triage ({pendingList.length})
        </button>
        <button
          className={`emergency-tab-btn ${tab === 'acknowledged' ? 'active' : ''}`}
          onClick={() => setTab('acknowledged')}
        >
          In Progress / Escalated ({ackList.length})
        </button>
        <button
          className={`emergency-tab-btn ${tab === 'resolved' ? 'active' : ''}`}
          onClick={() => setTab('resolved')}
        >
          Resolved Archive ({resolvedList.length})
        </button>
      </div>

      {/* Emergency Cards Grid */}
      <div style={{ marginBottom: 32 }}>
        {currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No emergency incidents in {tab} status.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {currentList.map((e) => (
              <EmergencyCard
                key={e._id}
                emergency={e}
                isAdmin={isAdmin}
                isDoctor={isDoctor}
                isNurse={isNurse}
                onAcknowledge={handleAcknowledge}
                onAddObservation={handleAddObservation}
                onEscalate={handleEscalate}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>

      {/* Timeline Audit History */}
      <Card title="Emergency Response Timeline & Incident Log" subtitle="Timestamped audit trail of detections, acknowledgments, and resolutions">
        <EmergencyTimeline emergencies={emergencies} />
      </Card>
    </div>
  );
}

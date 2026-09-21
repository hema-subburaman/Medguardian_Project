import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { fetchPatients } from '../services/patientService';
import { fetchPatientHistory } from '../services/historyService';

export default function PatientHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdFromUrl || '');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients().then((list) => {
      setPatients(list);
      if (!selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      fetchPatientHistory(selectedPatientId)
        .then((res) => {
          setHistoryData(res);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
    setSearchParams({ patientId: id });
  };

  const emergencyCols = [
    { key: 'createdAt', header: 'Timestamp', render: (e) => new Date(e.createdAt).toLocaleString() },
    { key: 'type', header: 'Emergency Type', render: (e) => <strong>{e.type.replace('_', ' ')}</strong> },
    { key: 'riskScore', header: 'Risk Score', render: (e) => `${e.riskScore}/100` },
    { key: 'message', header: 'Clinical Reason' },
    { key: 'status', header: 'Status', render: (e) => <Badge status={e.status} /> }
  ];

  return (
    <div>
      <div className="history-controls-bar">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            Patient Physiological History
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Historical trends, AI assessments, and timeline incidents.
          </p>
        </div>

        {/* Patient Selector */}
        <select
          value={selectedPatientId}
          onChange={(e) => handleSelectPatient(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: 220 }}
        >
          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.patientId} · Room {p.room})
            </option>
          ))}
        </select>
      </div>

      {loading || !historyData ? (
        <Loader label="Loading patient telemetry records..." />
      ) : (
        <>
          {/* Trend KPI Summary Grid */}
          <div className="trend-summary-grid">
            <div className="trend-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Heart Rate</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {historyData.summary?.avgHeartRate || 75} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>BPM</span>
              </div>
            </div>

            <div className="trend-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Min Oxygen (SpO₂)</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--vital-teal)' }}>
                {historyData.summary?.minSpo2 || 98} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>%</span>
              </div>
            </div>

            <div className="trend-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Emergencies</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-critical)' }}>
                {historyData.summary?.emergencyCount || 0}
              </div>
            </div>

            <div className="trend-card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Risk</div>
              <div style={{ marginTop: 8 }}>
                <Badge status={historyData.summary?.currentRisk || 'NORMAL'} />
              </div>
            </div>
          </div>

          {/* Dual Charts Row */}
          <div className="charts-dual-grid">
            <Card title="Heart Rate & SpO₂ Trend" subtitle="Historical continuous readings">
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={historyData.vitalsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="hr" domain={[50, 150]} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="spo2" orientation="right" domain={[80, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend />
                    <Line yAxisId="hr" type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#F04438" strokeWidth={2} dot={false} />
                    <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#0EA5A4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Body Temperature Trend" subtitle="Continuous Celsius readings (DHT11)">
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={historyData.vitalsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis domain={[35, 40]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F79009" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Emergency Incident History Table */}
          <Card title="Recorded Emergency Incidents for Patient" subtitle="Historical timeline of triggered warnings & critical events">
            <Table columns={emergencyCols} data={historyData.emergencies || []} emptyMessage="No recorded emergencies for this patient." />
          </Card>
        </>
      )}
    </div>
  );
}

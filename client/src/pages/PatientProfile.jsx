import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiHeart,
  FiWind,
  FiThermometer,
  FiActivity,
  FiPhone,
  FiHome,
  FiClock,
  FiCalendar
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ExplainableAICard from '../components/monitoring/ExplainableAICard';
import PatientModal from '../components/patient/PatientModal';
import { fetchPatientById, updatePatient } from '../services/patientService';
import { getStaffList } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function PatientProfile() {
  const { isDoctor } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPatientById(id);
      setPatient(data);
    } catch (err) {
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    getStaffList().then((staff) => {
      setDoctors(staff.filter((s) => s.role === 'DOCTOR' || s.role === 'ADMIN'));
      setNurses(staff.filter((s) => s.role === 'NURSE'));
    }).catch(() => {});
  }, [id]);

  if (loading || !patient) {
    return <Loader fullScreen label="Loading patient clinical profile..." />;
  }

  return (
    <div>
      <Link to="/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <FiArrowLeft /> Back to Patients Roster
      </Link>

      {/* Patient Header Banner */}
      <div className="patient-profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="patient-avatar-large">
            {patient.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
                {patient.name}
              </h1>
              <Badge status={patient.riskLevel} />
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 2 }}>
              ID: <strong>{patient.patientId}</strong> · {patient.age} Years · {patient.gender} · Blood Group: <strong>{patient.bloodGroup}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {isDoctor && (
            <Button variant="secondary" icon={FiEdit2} onClick={() => setEditOpen(true)}>
              Edit Record
            </Button>
          )}
          <Link to={`/history?patientId=${patient._id}`} className="btn btn-primary">
            <FiClock style={{ marginRight: 6 }} /> View Historical Trends
          </Link>
        </div>
      </div>

      {/* Physiological Vitals Tile Grid */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>
          Current Physiological Telemetry
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-critical"><FiHeart /></div>
            <div className="stat-content">
              <div className="stat-label">Heart Rate</div>
              <div className="stat-value">{patient.vitals?.heartRate || '—'} <span style={{ fontSize: '0.85rem' }}>BPM</span></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-teal"><FiWind /></div>
            <div className="stat-content">
              <div className="stat-label">Blood Oxygen (SpO₂)</div>
              <div className="stat-value">{patient.vitals?.spo2 || '—'} <span style={{ fontSize: '0.85rem' }}>%</span></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-warning"><FiThermometer /></div>
            <div className="stat-content">
              <div className="stat-label">Body Temperature</div>
              <div className="stat-value">{patient.vitals?.temperature || '—'} <span style={{ fontSize: '0.85rem' }}>°C</span></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-blue"><FiActivity /></div>
            <div className="stat-content">
              <div className="stat-label">Blood Pressure</div>
              <div className="stat-value" style={{ fontSize: '1.45rem' }}>{patient.vitals?.bloodPressure || '120/80'} <span style={{ fontSize: '0.8rem' }}>mmHg</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Explainable AI Clinical Card */}
      <ExplainableAICard aiRisk={patient.aiRisk} />

      {/* Admission and Contact Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <Card title="Ward & Admission Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
            <div className="meta-item">
              <FiHome style={{ color: 'var(--text-muted)' }} /> Room / Bed: <strong>{patient.room}</strong>
            </div>
            <div className="meta-item">
              <FiActivity style={{ color: 'var(--text-muted)' }} /> Condition: <strong>{patient.disease}</strong>
            </div>
            <div className="meta-item">
              <FiCalendar style={{ color: 'var(--text-muted)' }} /> Admitted: <strong>{new Date(patient.admissionDate).toLocaleDateString()}</strong>
            </div>
            <div className="meta-item">
              <FiActivity style={{ color: 'var(--text-muted)' }} /> Assigned Physician: <strong>{patient.assignedDoctor?.name || 'Unassigned'}</strong>
            </div>
            <div className="meta-item">
              <FiActivity style={{ color: 'var(--text-muted)' }} /> Assigned Nurse: <strong>{patient.assignedNurse?.name || 'Unassigned'}</strong>
            </div>
          </div>
        </Card>

        <Card title="Emergency Contact & Next of Kin">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
            <div className="meta-item">
              <FiPhone style={{ color: 'var(--text-muted)' }} /> Name: <strong>{patient.emergencyContact?.name || 'None'}</strong>
            </div>
            <div className="meta-item">
              <FiPhone style={{ color: 'var(--text-muted)' }} /> Relation: <strong>{patient.emergencyContact?.relation || 'Family'}</strong>
            </div>
            <div className="meta-item">
              <FiPhone style={{ color: 'var(--text-muted)' }} /> Phone Number: <strong>{patient.emergencyContact?.phone || 'None'}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Medical History */}
      <Card title="Clinical Notes & Medical History">
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {patient.medicalHistory || 'No prior clinical history noted on admission.'}
        </p>
      </Card>

      <PatientModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        patient={patient}
        doctors={doctors}
        nurses={nurses}
        onSave={async (payload) => {
          await updatePatient(patient._id, payload);
          loadData();
        }}
      />
    </div>
  );
}

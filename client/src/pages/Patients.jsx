import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiActivity } from 'react-icons/fi';
import PatientFilters from '../components/patient/PatientFilters';
import PatientModal from '../components/patient/PatientModal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Loader from '../components/ui/Loader';
import { useAuth } from '../context/AuthContext';
import { getStaffList } from '../services/authService';
import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient
} from '../services/patientService';

export default function Patients() {
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [gender, setGender] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await fetchPatients({ search, riskLevel, gender });
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStaffList().then((staff) => {
      setDoctors(staff.filter((s) => s.role === 'DOCTOR' || s.role === 'ADMIN'));
      setNurses(staff.filter((s) => s.role === 'NURSE'));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadPatients();
  }, [search, riskLevel, gender]);

  const handleSave = async (payload) => {
    if (selectedPatient) {
      await updatePatient(selectedPatient._id, payload);
    } else {
      await createPatient(payload);
    }
    loadPatients();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently remove patient ${name}?`)) {
      await deletePatient(id);
      loadPatients();
    }
  };

  const columns = [
    {
      key: 'patientId',
      header: 'Patient ID',
      render: (p) => <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{p.patientId}</span>
    },
    {
      key: 'name',
      header: 'Patient Name',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender} · {p.bloodGroup}</span>
        </div>
      )
    },
    { key: 'disease', header: 'Condition / Diagnosis' },
    { key: 'room', header: 'Room / Bed' },
    {
      key: 'vitals',
      header: 'Live Vitals',
      render: (p) => (
        <span style={{ fontSize: '0.85rem' }}>
          HR: <strong>{p.vitals?.heartRate || '—'}</strong> | SpO₂: <strong>{p.vitals?.spo2 || '—'}%</strong> | Temp: <strong>{p.vitals?.temperature || '—'}°C</strong>
        </span>
      )
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      render: (p) => <Badge status={p.riskLevel} />
    },
    {
      key: 'deviceId',
      header: 'IoT Sensor',
      render: (p) => (
        <span style={{ fontSize: '0.8rem', color: p.deviceId ? 'var(--vital-teal)' : 'var(--text-light)' }}>
          {p.deviceId || 'Unpaired'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/patients/${p._id}`} className="btn btn-secondary btn-sm" title="View Patient Profile">
            <FiEye />
          </Link>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedPatient(p);
              setModalOpen(true);
            }}
            title="Edit Details"
          >
            <FiEdit2 />
          </button>
          {isAdmin && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(p._id, p.name)}
              title="Delete Patient Record"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Patient Management</h1>
          <p>Admit, monitor, and manage clinical records across all hospital wards.</p>
        </div>
        <div className="page-actions">
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={() => {
              setSelectedPatient(null);
              setModalOpen(true);
            }}
          >
            Admit New Patient
          </Button>
        </div>
      </div>

      <PatientFilters
        search={search}
        onSearchChange={setSearch}
        riskLevel={riskLevel}
        onRiskChange={setRiskLevel}
        gender={gender}
        onGenderChange={setGender}
        onReset={() => {
          setSearch('');
          setRiskLevel('');
          setGender('');
        }}
      />

      {loading ? (
        <Loader label="Loading ward patient roster..." />
      ) : (
        <Card>
          <Table columns={columns} data={patients} emptyMessage="No matching patient records found." />
        </Card>
      )}

      <PatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        patient={selectedPatient}
        doctors={doctors}
        nurses={nurses}
        onSave={handleSave}
      />
    </div>
  );
}

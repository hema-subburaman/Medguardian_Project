import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function PatientModal({
  isOpen,
  onClose,
  patient,
  doctors = [],
  nurses = [],
  onSave
}) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    disease: '',
    room: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Family',
    assignedDoctor: '',
    assignedNurse: '',
    deviceId: '',
    medicalHistory: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        bloodGroup: patient.bloodGroup || 'O+',
        disease: patient.disease || '',
        room: patient.room || '',
        emergencyContactName: patient.emergencyContact?.name || '',
        emergencyContactPhone: patient.emergencyContact?.phone || '',
        emergencyContactRelation: patient.emergencyContact?.relation || 'Family',
        assignedDoctor: patient.assignedDoctor?._id || patient.assignedDoctor || '',
        assignedNurse: patient.assignedNurse?._id || patient.assignedNurse || '',
        deviceId: patient.deviceId || '',
        medicalHistory: patient.medicalHistory || ''
      });
    } else {
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        bloodGroup: 'O+',
        disease: '',
        room: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: 'Family',
        assignedDoctor: doctors[0]?._id || '',
        assignedNurse: nurses[0]?._id || '',
        deviceId: '',
        medicalHistory: ''
      });
    }
  }, [patient, isOpen, doctors, nurses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.disease || !formData.room) {
      setError('Please fill all required clinical fields');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        disease: formData.disease,
        room: formData.room,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relation: formData.emergencyContactRelation
        },
        assignedDoctor: formData.assignedDoctor || null,
        assignedNurse: formData.assignedNurse || null,
        deviceId: formData.deviceId || null,
        medicalHistory: formData.medicalHistory
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save patient record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patient ? `Edit Patient: ${patient.name}` : 'Register New Ward Patient'}
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" isLoading={saving} onClick={handleSubmit}>
            {patient ? 'Save Changes' : 'Admit Patient'}
          </Button>
        </>
      )}
    >
      {error && <div className="form-error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Input
            label="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Eleanor Rigby"
          />
          <Input
            label="Age"
            type="number"
            required
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="Years"
          />
          <div className="form-group">
            <label className="form-label">Gender <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <Input
            label="Condition / Diagnosis"
            required
            value={formData.disease}
            onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
            placeholder="e.g. Acute Myocardial Infarction"
          />
          <Input
            label="Room / Bed"
            required
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="e.g. ICU-302"
          />
          <Input
            label="IoT Hardware Device ID"
            value={formData.deviceId}
            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
            placeholder="e.g. ESP32-MED-01"
          />
          <div className="form-group">
            <label className="form-label">Assigned Attending Doctor</label>
            <select
              className="form-select"
              value={formData.assignedDoctor}
              onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.department})</option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.92rem', margin: '20px 0 10px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          Emergency Contact Details
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <Input
            label="Contact Name"
            value={formData.emergencyContactName}
            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
            placeholder="Next of kin"
          />
          <Input
            label="Contact Phone"
            value={formData.emergencyContactPhone}
            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            label="Relationship"
            value={formData.emergencyContactRelation}
            onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
            placeholder="Spouse / Parent / Sibling"
          />
        </div>

        <div className="form-group" style={{ marginTop: 14 }}>
          <label className="form-label">Medical History / Allergies / Notes</label>
          <textarea
            rows={3}
            className="form-textarea"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            placeholder="Prior surgeries, known drug allergies, chronic conditions..."
          />
        </div>
      </form>
    </Modal>
  );
}

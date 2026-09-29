import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import { FiCpu, FiWifi, FiBattery, FiLink, FiShield } from 'react-icons/fi';
import { fetchDevices, linkDevice } from '../services/deviceService';
import { fetchPatients } from '../services/patientService';
import { useAuth } from '../context/AuthContext';

export default function Devices() {
  const { isAdmin } = useAuth();
  const [devices, setDevices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devs, pts] = await Promise.all([
        fetchDevices(),
        fetchPatients()
      ]);
      setDevices(devs);
      setPatients(pts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLinkDevice = async (deviceId) => {
    if (!patients || patients.length === 0) {
      alert('No patients available to assign.');
      return;
    }

    const patientOptions = patients.map((p, idx) => `${idx + 1}. ${p.name} (${p.patientId} - Room ${p.room})`).join('\n');
    const choice = window.prompt(`Select patient number to assign ${deviceId}:\n\n${patientOptions}`);
    if (choice) {
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < patients.length) {
        try {
          await linkDevice(deviceId, patients[idx]._id);
          alert(`Successfully assigned ${deviceId} to ${patients[idx].name}`);
          loadData();
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to link device');
        }
      } else {
        alert('Invalid selection.');
      }
    }
  };

  const columns = [
    {
      key: 'deviceId',
      header: 'Device Identifier',
      render: (d) => (
        <span style={{ fontWeight: 700, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiCpu /> {d.deviceId}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Connection Status',
      render: (d) => <Badge status={d.status} />
    },
    {
      key: 'patientId',
      header: 'Linked Patient',
      render: (d) => d.patientId ? <strong>{d.patientId.name} ({d.patientId.room})</strong> : <span style={{ color: 'var(--text-light)' }}>Unpaired</span>
    },
    { key: 'ipAddress', header: 'Local IP Address' },
    {
      key: 'batteryLevel',
      header: 'Battery',
      render: (d) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FiBattery /> {d.batteryLevel}%
        </span>
      )
    },
    { key: 'firmwareVersion', header: 'Firmware' },
    {
      key: 'lastSeen',
      header: 'Last Heartbeat',
      render: (d) => new Date(d.lastSeen).toLocaleTimeString()
    }
  ];

  if (isAdmin) {
    columns.push({
      key: 'actions',
      header: 'Admin Assignment',
      render: (d) => (
        <Button
          variant="secondary"
          size="sm"
          icon={FiLink}
          onClick={() => handleLinkDevice(d.deviceId)}
        >
          Assign Patient
        </Button>
      )
    });
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>ESP32 IoT Devices & Gateways</h1>
          <p>Active hardware telemetry gateways paired with physiological sensors.</p>
        </div>
      </div>

      {isAdmin && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          background: 'rgba(23, 92, 211, 0.08)',
          border: '1px solid rgba(23, 92, 211, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          color: 'var(--text-primary)',
          fontSize: '0.88rem'
        }}>
          <FiShield style={{ color: 'var(--primary-blue)', fontSize: '1.2rem', flexShrink: 0 }} />
          <div>
            <strong>Administrator Hardware Control:</strong> You have system permissions to manage ESP32 gateways and assign physiological sensors to admitted hospital beds.
          </div>
        </div>
      )}

      {loading ? (
        <Loader label="Scanning IoT hardware gateways..." />
      ) : (
        <Card title="Registered Hardware Fleet" subtitle="ESP32 DevKits equipped with MAX30100, MPU6050, and DHT11 sensors">
          <Table columns={columns} data={devices} emptyMessage="No registered IoT devices." />
        </Card>
      )}
    </div>
  );
}

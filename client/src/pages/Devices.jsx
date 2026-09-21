import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import { FiCpu, FiWifi, FiBattery } from 'react-icons/fi';
import { fetchDevices } from '../services/deviceService';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices()
      .then((res) => setDevices(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>ESP32 IoT Devices</h1>
          <p>Active hardware telemetry gateways paired with physiological sensors.</p>
        </div>
      </div>

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

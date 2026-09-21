import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Device from '../models/Device.js';
import Telemetry from '../models/Telemetry.js';
import Emergency from '../models/Emergency.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medguardian';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await User.deleteMany();
    await Patient.deleteMany();
    await Device.deleteMany();
    await Telemetry.deleteMany();
    await Emergency.deleteMany();
    await AuditLog.deleteMany();

    console.log('Creating Healthcare Staff Accounts...');
    const admin = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'admin@medguardian.io',
      password: 'admin123',
      role: 'ADMIN',
      department: 'Chief of Medicine',
      phone: '+1 (555) 100-2001'
    });

    const doctor = await User.create({
      name: 'Dr. Robert Chen',
      email: 'doctor@medguardian.io',
      password: 'doctor123',
      role: 'DOCTOR',
      department: 'Cardiology',
      phone: '+1 (555) 100-2002'
    });

    const nurse = await User.create({
      name: 'Nurse Emily Rodriguez',
      email: 'nurse@medguardian.io',
      password: 'nurse123',
      role: 'NURSE',
      department: 'Intensive Care Unit',
      phone: '+1 (555) 100-2003'
    });

    console.log('Creating Sample Patients...');
    const p1 = await Patient.create({
      patientId: 'PT-0001',
      name: 'Arthur Vance',
      age: 68,
      gender: 'Male',
      bloodGroup: 'O+',
      disease: 'Coronary Artery Disease',
      room: 'ICU-302',
      emergencyContact: { name: 'Eleanor Vance', phone: '+1 (555) 345-6789', relation: 'Spouse' },
      assignedDoctor: doctor._id,
      assignedNurse: nurse._id,
      deviceId: 'ESP32-MED-01',
      status: 'admitted',
      vitals: { heartRate: 74, spo2: 98, temperature: 36.7, bloodPressure: '122/80', lastUpdated: new Date() },
      riskLevel: 'NORMAL',
      medicalHistory: 'Hypertension diagnosed 2018, stent placed in 2021.'
    });

    const p2 = await Patient.create({
      patientId: 'PT-0002',
      name: 'Clara Oswald',
      age: 54,
      gender: 'Female',
      bloodGroup: 'A+',
      disease: 'Acute Bronchitis',
      room: 'Ward-204',
      emergencyContact: { name: 'David Oswald', phone: '+1 (555) 456-7890', relation: 'Brother' },
      assignedDoctor: doctor._id,
      assignedNurse: nurse._id,
      deviceId: 'ESP32-MED-02',
      status: 'admitted',
      vitals: { heartRate: 104, spo2: 92, temperature: 37.9, bloodPressure: '135/88', lastUpdated: new Date() },
      riskLevel: 'WARNING',
      medicalHistory: 'Asthma history since childhood.'
    });

    const p3 = await Patient.create({
      patientId: 'PT-0003',
      name: 'Marcus Brody',
      age: 76,
      gender: 'Male',
      bloodGroup: 'B-',
      disease: 'Congestive Heart Failure',
      room: 'ICU-305',
      emergencyContact: { name: 'Linda Brody', phone: '+1 (555) 567-8901', relation: 'Daughter' },
      assignedDoctor: admin._id,
      assignedNurse: nurse._id,
      deviceId: 'ESP32-MED-03',
      status: 'admitted',
      vitals: { heartRate: 126, spo2: 87, temperature: 38.4, bloodPressure: '160/98', lastUpdated: new Date() },
      riskLevel: 'HIGH',
      medicalHistory: 'Type II diabetes, chronic kidney disease.'
    });

    const p4 = await Patient.create({
      patientId: 'PT-0004',
      name: 'Sophia Martinez',
      age: 32,
      gender: 'Female',
      bloodGroup: 'AB+',
      disease: 'Post-Op Monitoring',
      room: 'Room-108',
      emergencyContact: { name: 'Carlos Martinez', phone: '+1 (555) 678-9012', relation: 'Husband' },
      assignedDoctor: doctor._id,
      assignedNurse: nurse._id,
      deviceId: null,
      status: 'admitted',
      vitals: { heartRate: 70, spo2: 99, temperature: 36.6, bloodPressure: '118/75', lastUpdated: new Date() },
      riskLevel: 'NORMAL',
      medicalHistory: 'Laparoscopic appendectomy on admission day.'
    });

    console.log('Creating ESP32 Hardware Devices...');
    await Device.create([
      {
        deviceId: 'ESP32-MED-01',
        patientId: p1._id,
        status: 'ONLINE',
        firmwareVersion: '1.0.0-node',
        lastSeen: new Date(),
        ipAddress: '192.168.1.101',
        batteryLevel: 94
      },
      {
        deviceId: 'ESP32-MED-02',
        patientId: p2._id,
        status: 'ONLINE',
        firmwareVersion: '1.0.0-node',
        lastSeen: new Date(),
        ipAddress: '192.168.1.102',
        batteryLevel: 82
      },
      {
        deviceId: 'ESP32-MED-03',
        patientId: p3._id,
        status: 'CRITICAL',
        firmwareVersion: '1.0.0-node',
        lastSeen: new Date(),
        ipAddress: '192.168.1.103',
        batteryLevel: 68,
        alarmActive: true
      }
    ]);

    console.log('Creating Historical Telemetry for Charts...');
    const now = Date.now();
    const telemetryBatch = [];
    for (let i = 30; i >= 0; i--) {
      const ts = new Date(now - i * 60 * 1000); // 1-minute intervals
      telemetryBatch.push({
        deviceId: 'ESP32-MED-01',
        patientId: p1._id,
        heartRate: 72 + Math.round(Math.sin(i) * 5),
        spo2: 98,
        temperature: 36.7,
        humidity: 50,
        accelX: 0.02,
        accelY: 0.05,
        accelZ: 0.98,
        accelMagnitude: 1.0,
        motionState: 'Stable',
        fallDetected: false,
        sosPressed: false,
        riskLevel: 'NORMAL',
        riskScore: 12,
        timestamp: ts
      });

      telemetryBatch.push({
        deviceId: 'ESP32-MED-03',
        patientId: p3._id,
        heartRate: 122 + Math.round(Math.cos(i) * 6),
        spo2: 88 + Math.round(Math.sin(i) * 2),
        temperature: 38.3,
        humidity: 55,
        accelX: 0.15,
        accelY: 0.18,
        accelZ: 1.05,
        accelMagnitude: 1.08,
        motionState: 'Restless',
        fallDetected: false,
        sosPressed: false,
        riskLevel: 'HIGH',
        riskScore: 88,
        timestamp: ts
      });
    }
    await Telemetry.insertMany(telemetryBatch);

    console.log('Creating Initial Clinical Emergencies...');
    await Emergency.create([
      {
        patient: p3._id,
        device: 'ESP32-MED-03',
        type: 'CRITICAL_VITALS',
        severity: 'CRITICAL',
        riskScore: 92,
        riskLevel: 'HIGH',
        message: 'Critical Tachycardia (128 BPM) & Severe Hypoxia (87% SpO2)',
        reasons: [
          'Heart rate critically high (128 BPM > 120 safety threshold)',
          'SpO2 critically low (87% < 90% threshold)',
          'Elevated body temperature detected (38.4°C)'
        ],
        recommendation: 'Immediate medical bedside attention required. Notify attending physician.',
        vitalsSnapshot: { heartRate: 128, spo2: 87, temperature: 38.4, accelMagnitude: 1.08 },
        status: 'pending'
      },
      {
        patient: p2._id,
        device: 'ESP32-MED-02',
        type: 'FALL_DETECTED',
        severity: 'HIGH',
        riskScore: 96,
        riskLevel: 'HIGH',
        message: 'High impact detected: 2.75g (Threshold: 2.5g)',
        reasons: ['Sudden fall pattern and floor impact detected on MPU6050 accelerometer'],
        recommendation: 'Check patient bedside for trauma or loss of consciousness.',
        vitalsSnapshot: { heartRate: 104, spo2: 92, temperature: 37.9, accelMagnitude: 2.75 },
        status: 'acknowledged',
        acknowledgedBy: nurse._id,
        acknowledgedAt: new Date(Date.now() - 15 * 60 * 1000)
      }
    ]);

    console.log('Creating Initial Audit Trail...');
    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZED',
        performerName: 'System Seeder',
        targetType: 'SYSTEM',
        details: { message: 'MedGuardian clinical database seeded with test staff, patients, and hardware.' }
      }
    ]);

    console.log('==================================================');
    console.log('  SEED COMPLETE: MedGuardian Database Initialized');
    console.log('  Demo Staff Credentials:');
    console.log('  - Admin:  admin@medguardian.io  / admin123');
    console.log('  - Doctor: doctor@medguardian.io / doctor123');
    console.log('  - Nurse:  nurse@medguardian.io  / nurse123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();

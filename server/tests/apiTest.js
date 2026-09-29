import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('  MEDGUARDIAN BACKEND END-TO-END VERIFICATION');
  console.log('==================================================\n');

  try {
    // 1. Health Check
    console.log('[Test 1] Health Check GET /api/health');
    const health = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log('-> Status:', health.status, '| System:', health.data.system);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Auth Login
    console.log('\n[Test 2] Auth Staff Login POST /api/auth/login');
    const login = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'doctor@medguardian.io', password: 'doctor123' });
    console.log('-> Status:', login.status, '| User:', login.data?.data?.name, '| Role:', login.data?.data?.role);
    if (login.status !== 200 || !login.data?.data?.token) throw new Error('Auth login failed');
    const token = login.data.data.token;

    // 3. Patient Directory
    console.log('\n[Test 3] Patient Directory GET /api/patients');
    const patients = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/patients',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('-> Status:', patients.status, '| Total Admitted Patients:', patients.data.count);
    if (patients.status !== 200 || patients.data.count === 0) throw new Error('Patient directory retrieval failed');
    const testPatient = patients.data.data[0];

    // 4. Ingest Normal ESP32 Telemetry
    console.log('\n[Test 4] Normal Telemetry POST /api/telemetry');
    const normalTelemetry = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/telemetry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      deviceId: 'ESP32-MED-01',
      patientId: testPatient._id,
      heartRate: 74,
      spo2: 98,
      temperature: 36.7,
      accelMagnitude: 1.0,
      fallDetected: false,
      sosPressed: false
    });
    console.log('-> Status:', normalTelemetry.status, '| Risk:', normalTelemetry.data.riskLevel, '| Alarm:', normalTelemetry.data.alarm);
    if (normalTelemetry.status !== 200 || normalTelemetry.data.riskLevel !== 'NORMAL') throw new Error('Normal telemetry evaluation failed');

    // 5. Ingest Critical Tachycardia & Hypoxia Telemetry (AI Risk Engine check)
    console.log('\n[Test 5] Critical Vitals POST /api/telemetry (HR: 135, SpO2: 86%)');
    const criticalTelemetry = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/telemetry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      deviceId: 'ESP32-MED-01',
      patientId: testPatient._id,
      heartRate: 135,
      spo2: 86,
      temperature: 38.6,
      accelMagnitude: 1.05,
      fallDetected: false,
      sosPressed: false
    });
    console.log('-> Status:', criticalTelemetry.status, '| Risk:', criticalTelemetry.data.riskLevel, '| Score:', criticalTelemetry.data.riskScore, '| Buzzer Alarm Commanded:', criticalTelemetry.data.alarm);
    if (criticalTelemetry.status !== 200 || criticalTelemetry.data.riskLevel !== 'HIGH' || !criticalTelemetry.data.alarm) {
      throw new Error('Critical risk telemetry evaluation failed');
    }

    // 6. Ingest Fall Detection Telemetry (MPU6050 spike)
    console.log('\n[Test 6] Fall Detection POST /api/telemetry (Accel: 3.1g)');
    const fallTelemetry = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/telemetry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      deviceId: 'ESP32-MED-01',
      patientId: testPatient._id,
      heartRate: 88,
      spo2: 96,
      temperature: 36.8,
      accelX: 2.5,
      accelY: 1.8,
      accelZ: 2.9,
      gyroX: 135,
      fallDetected: true,
      sosPressed: false
    });
    console.log('-> Status:', fallTelemetry.status, '| Risk:', fallTelemetry.data.riskLevel, '| Alarm Commanded:', fallTelemetry.data.alarm);
    if (fallTelemetry.status !== 200 || fallTelemetry.data.riskLevel !== 'HIGH') throw new Error('Fall telemetry evaluation failed');

    // 7. Verify Emergency Center & Pending Alerts
    console.log('\n[Test 7] Verify Emergency Center GET /api/emergency');
    const emergencies = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/emergency?status=pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('-> Status:', emergencies.status, '| Pending Emergencies:', emergencies.data.count);
    if (emergencies.status !== 200 || emergencies.data.count === 0) throw new Error('Emergency creation failed');
    const pendingEmergency = emergencies.data.data[0];

    // 8. Acknowledge Emergency
    console.log(`\n[Test 8] Acknowledge Emergency PATCH /api/emergency/${pendingEmergency._id}/acknowledge`);
    const ack = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/emergency/${pendingEmergency._id}/acknowledge`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('-> Status:', ack.status, '| New Status:', ack.data?.data?.status, '| Ack by:', ack.data?.data?.acknowledgedBy?.name);
    if (ack.status !== 200 || ack.data?.data?.status !== 'acknowledged') throw new Error('Emergency acknowledgment failed');

    // 9. Dashboard Analytics & Stats
    console.log('\n[Test 9] Dashboard Statistics GET /api/dashboard/stats');
    const stats = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('-> Status:', stats.status, '| Stats:', stats.data.data);
    if (stats.status !== 200) throw new Error('Dashboard stats failed');

    console.log('\n==================================================');
    console.log('  ALL 9 BACKEND VERIFICATION TESTS PASSED (100%)');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Verification Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();

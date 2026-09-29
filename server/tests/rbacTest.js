import http from 'http';

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

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

async function loginUser(email, password) {
  const res = await request({
    hostname: BASE_HOST,
    port: BASE_PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });

  if (res.status !== 200 || !res.data?.data?.token) {
    throw new Error(`Failed to log in as ${email}: HTTP ${res.status}`);
  }
  return {
    token: res.data.data.token,
    user: res.data.data
  };
}

async function runRBACTests() {
  console.log('================================================================');
  console.log('   MEDGUARDIAN STRICT RBAC (ROLE-BASED ACCESS CONTROL) VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertStatus(testNum, testName, actualStatus, expectedStatus) {
    totalTests++;
    const passed = actualStatus === expectedStatus;
    if (passed) {
      passedTests++;
      console.log(`[PASS] Test ${testNum}: ${testName} -> Got ${actualStatus} (Expected ${expectedStatus})`);
    } else {
      console.error(`[FAIL] Test ${testNum}: ${testName} -> Got ${actualStatus} (Expected ${expectedStatus})`);
      throw new Error(`RBAC Failure on Test ${testNum}: ${testName}`);
    }
  }

  try {
    // 1. Authenticate all three roles
    console.log('[Auth] Authenticating ADMIN, DOCTOR, and NURSE...');
    const admin = await loginUser('admin@medguardian.io', 'admin123');
    const doctor = await loginUser('doctor@medguardian.io', 'doctor123');
    const nurse = await loginUser('nurse@medguardian.io', 'nurse123');
    console.log(`-> Logged in: Admin (${admin.user.name}), Doctor (${doctor.user.name}), Nurse (${nurse.user.name})\n`);

    // Fetch a pending emergency for workflow testing
    const emergencyRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/emergency?status=pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctor.token}` }
    });

    let emergencyId;
    if (emergencyRes.data?.data?.length > 0) {
      emergencyId = emergencyRes.data.data[0]._id;
    } else {
      // Trigger one via telemetry if none pending
      const trigger = await request({
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/telemetry',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        deviceId: 'ESP32-MED-01',
        patientId: '6ab3d72cfd13106c0cdd5e01',
        heartRate: 140,
        spo2: 85,
        temperature: 39.0,
        accelMagnitude: 1.0,
        fallDetected: false,
        sosPressed: false
      });
      const fetchNew = await request({
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/emergency?status=pending',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${doctor.token}` }
      });
      emergencyId = fetchNew.data?.data?.[0]?._id;
    }
    console.log(`-> Using target Emergency ID: ${emergencyId}\n`);

    console.log('--- SECTION 1: EMERGENCY WORKFLOW RBAC ---');

    // Test 1: ADMIN attempts to ACKNOWLEDGE emergency -> 403 Forbidden
    const adminAck = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/acknowledge`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${admin.token}` }
    });
    assertStatus(1, 'ADMIN attempts to Acknowledge Emergency', adminAck.status, 403);

    // Test 2: ADMIN attempts to RESOLVE emergency -> 403 Forbidden
    const adminResolve = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/resolve`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${admin.token}`,
        'Content-Type': 'application/json'
      }
    }, { notes: 'Admin trying to resolve' });
    assertStatus(2, 'ADMIN attempts to Resolve Emergency', adminResolve.status, 403);

    // Test 3: NURSE ACKNOWLEDGES emergency -> 200 OK
    const nurseAck = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/acknowledge`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${nurse.token}` }
    });
    assertStatus(3, 'NURSE Acknowledges Emergency', nurseAck.status, 200);

    // Test 4: NURSE records Bedside Observation -> 200 OK
    const nurseObs = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/observation`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nurse.token}`,
        'Content-Type': 'application/json'
      }
    }, { observation: 'Patient is dyspneic, nasal cannula oxygen started at 4L/min.' });
    assertStatus(4, 'NURSE records Bedside Observation', nurseObs.status, 200);

    // Test 5: NURSE escalates emergency to Doctor -> 200 OK
    const nurseEscalate = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/escalate`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${nurse.token}`,
        'Content-Type': 'application/json'
      }
    }, { notes: 'Persistent desaturation below 88% despite supplemental O2.' });
    assertStatus(5, 'NURSE Escalates Emergency to Doctor', nurseEscalate.status, 200);

    // Test 6: NURSE attempts to RESOLVE emergency -> 403 Forbidden
    const nurseResolve = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/resolve`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${nurse.token}`,
        'Content-Type': 'application/json'
      }
    }, { notes: 'Nurse attempting resolution' });
    assertStatus(6, 'NURSE attempts to Resolve Emergency', nurseResolve.status, 403);

    // Test 7: DOCTOR RESOLVES emergency -> 200 OK
    const doctorResolve = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/emergency/${emergencyId}/resolve`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${doctor.token}`,
        'Content-Type': 'application/json'
      }
    }, { notes: 'Bronchodilator nebulization completed. SpO2 restored to 97%. Stable.' });
    assertStatus(7, 'DOCTOR Resolves Emergency', doctorResolve.status, 200);

    console.log('\n--- SECTION 2: PATIENT CLINICAL MANAGEMENT RBAC ---');

    // Test 8: ADMIN attempts to ADMIT patient -> 403 Forbidden
    const adminAdmit = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/patients',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${admin.token}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Unauthorized Patient',
      age: 45,
      gender: 'Male',
      bloodGroup: 'O+',
      disease: 'Asthma',
      room: 'ICU-99'
    });
    assertStatus(8, 'ADMIN attempts to Admit New Patient', adminAdmit.status, 403);

    // Test 9: NURSE attempts to ADMIT patient -> 403 Forbidden
    const nurseAdmit = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/patients',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nurse.token}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Nurse Unauthorized Patient',
      age: 50,
      gender: 'Female',
      bloodGroup: 'A+',
      disease: 'Pneumonia',
      room: 'ICU-98'
    });
    assertStatus(9, 'NURSE attempts to Admit New Patient', nurseAdmit.status, 403);

    // Test 10: DOCTOR ADMITS new patient -> 201 Created
    const docAdmit = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/patients',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${doctor.token}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'RBAC Clinical Patient',
      age: 58,
      gender: 'Male',
      bloodGroup: 'B+',
      disease: 'Hypertensive Urgency',
      room: 'Cardiology-Bed-04',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1-555-0199',
        relation: 'Spouse'
      },
      assignedDoctor: doctor.user._id,
      assignedNurse: nurse.user._id
    });
    assertStatus(10, 'DOCTOR Admits New Clinical Patient', docAdmit.status, 201);
    const newPatientId = docAdmit.data?.data?._id;

    // Test 11: ADMIN attempts to EDIT patient medical info -> 403 Forbidden
    const adminEdit = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/patients/${newPatientId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${admin.token}`,
        'Content-Type': 'application/json'
      }
    }, { disease: 'Modified by Admin' });
    assertStatus(11, 'ADMIN attempts to Edit Patient Medical Record', adminEdit.status, 403);

    // Test 12: NURSE attempts to DELETE patient -> 403 Forbidden
    const nurseDel = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/patients/${newPatientId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${nurse.token}` }
    });
    assertStatus(12, 'NURSE attempts to Delete Patient Record', nurseDel.status, 403);

    // Test 13: DOCTOR EDITS patient medical info -> 200 OK
    const docEdit = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/patients/${newPatientId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${doctor.token}`,
        'Content-Type': 'application/json'
      }
    }, { disease: 'Hypertensive Urgency (Controlled)' });
    assertStatus(13, 'DOCTOR Updates Patient Medical Record', docEdit.status, 200);

    // Test 14: DOCTOR DELETES patient -> 200 OK
    const docDel = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/patients/${newPatientId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${doctor.token}` }
    });
    assertStatus(14, 'DOCTOR Discharges/Deletes Patient Record', docDel.status, 200);

    console.log('\n--- SECTION 3: IOT DEVICE & SYSTEM ADMINISTRATION RBAC ---');

    // Test 15: NURSE attempts to VIEW device fleet -> 403 Forbidden
    const nurseDevs = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/devices',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${nurse.token}` }
    });
    assertStatus(15, 'NURSE attempts to View Device Fleet', nurseDevs.status, 403);

    // Fetch an existing patient for device linking tests
    const existingPatientsRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/patients',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctor.token}` }
    });
    const validPatientId = existingPatientsRes.data?.data?.[0]?._id;

    // Test 16: DOCTOR attempts to LINK device to patient -> 403 Forbidden
    const docLink = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/devices/link',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${doctor.token}`,
        'Content-Type': 'application/json'
      }
    }, { deviceId: 'ESP32-MED-01', patientId: validPatientId });
    assertStatus(16, 'DOCTOR attempts to Link IoT Device', docLink.status, 403);

    // Test 17: ADMIN LINKS device to patient -> 200 OK
    const adminLink = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/devices/link',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${admin.token}`,
        'Content-Type': 'application/json'
      }
    }, { deviceId: 'ESP32-MED-01', patientId: validPatientId });
    assertStatus(17, 'ADMIN Links IoT Device to Patient', adminLink.status, 200);

    console.log('\n--- SECTION 4: USER & ANALYTICS ACCESS RBAC ---');

    // Test 18: NURSE attempts to access User Management -> 403 Forbidden
    const nurseUsers = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/auth/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${nurse.token}` }
    });
    assertStatus(18, 'NURSE attempts to access User Management', nurseUsers.status, 403);

    // Test 19: ADMIN accesses User Management -> 200 OK
    const adminUsers = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/auth/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${admin.token}` }
    });
    assertStatus(19, 'ADMIN accesses User Management', adminUsers.status, 200);

    // Test 20: NURSE attempts to access Ward Analytics -> 403 Forbidden
    const nurseAnalytics = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${nurse.token}` }
    });
    assertStatus(20, 'NURSE attempts to access Ward Analytics', nurseAnalytics.status, 403);

    // Test 21: DOCTOR accesses Ward Analytics -> 200 OK
    const docAnalytics = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: '/api/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctor.token}` }
    });
    assertStatus(21, 'DOCTOR accesses Ward Analytics', docAnalytics.status, 200);

    console.log('\n================================================================');
    console.log(`  ALL ${totalTests} RBAC AUTHORIZATION TESTS PASSED (100%)`);
    console.log('  Role enforcement verified for ADMIN, DOCTOR, and NURSE.');
    console.log('================================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ RBAC Test Suite Execution Failed:', err.message);
    process.exit(1);
  }
}

runRBACTests();

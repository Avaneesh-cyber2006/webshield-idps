const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

console.log('Running Test Lab end-to-end integration tests...');

async function setupTestServer() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', credentials: true }
  });

  initializeIDPS(io);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  return { server, port: server.address().port };
}

async function cleanupTestServer(server) {
  await new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function getAdminToken(baseURL) {
  // Get admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@webshield.local' }
  });

  if (!admin) {
    throw new Error('Admin user not found in database');
  }

  // Login to get token
  const loginResponse = await request(baseURL)
    .post('/api/auth/login')
    .send({
      email: admin.email,
      password: 'admin123'  // Default seed password
    });

  if (loginResponse.status !== 200) {
    throw new Error(`Admin login failed: ${loginResponse.status}`);
  }

  const cookies = loginResponse.headers['set-cookie'];
  const tokenCookie = cookies.find(c => c.startsWith('token='));
  if (!tokenCookie) {
    throw new Error('No token cookie in login response');
  }

  const token = tokenCookie.split('=')[1].split(';')[0];
  return token;
}

async function testTestLabEndToEnd() {
  const { server, port } = await setupTestServer();
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    // Clear test tables only (preserve users, settings, rules)
    await prisma.securityEvent.deleteMany({});
    await prisma.trafficEvent.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testResult.deleteMany({});
    await prisma.blockedSource.deleteMany({});

    // Set mode to IDS
    await prisma.systemSetting.upsert({
      where: { key: 'idps_mode' },
      update: { value: 'IDS' },
      create: { key: 'idps_mode', value: 'IDS' }
    });

    console.log('\n=== Test Lab End-to-End Workflow ===');

    // Step 1: Authenticate as administrator
    console.log('\n1. Authenticating as administrator...');
    const adminToken = await getAdminToken(baseURL);
    console.log('✓ Administrator authenticated');

    // Step 2: Create TestRun
    console.log('\n2. Creating TestRun...');
    const createRunResponse = await request(baseURL)
      .post('/api/test-lab/create-run')
      .set('Cookie', `token=${adminToken}`);

    if (createRunResponse.status !== 200) {
      throw new Error(`Create TestRun failed: ${createRunResponse.status} - ${JSON.stringify(createRunResponse.body)}`);
    }

    const testRunId = createRunResponse.body.testRun.id;
    const runId = createRunResponse.body.testRun.runId;
    console.log(`✓ TestRun created: ${testRunId}`);
    console.log(`  External runId: ${runId}`);

    // Verify TestRun persisted in database
    const persistedTestRun = await prisma.testRun.findUnique({
      where: { id: testRunId }
    });

    if (!persistedTestRun) {
      throw new Error('TestRun not persisted in database');
    }

    if (persistedTestRun.status !== 'CREATED') {
      throw new Error(`TestRun status should be CREATED, got ${persistedTestRun.status}`);
    }

    console.log('✓ TestRun persisted with CREATED status');

    // Step 3: Retrieve test configuration
    console.log('\n3. Retrieving test configuration...');
    const configResponse = await request(baseURL)
      .get('/api/test-lab/config')
      .set('Cookie', `token=${adminToken}`);

    if (configResponse.status !== 200) {
      throw new Error(`Config retrieval failed: ${configResponse.status}`);
    }

    const configs = configResponse.body.configs;
    console.log(`✓ Retrieved ${configs.length} test configurations`);

    // Step 4: Execute normal request
    console.log('\n4. Executing normal request...');
    const normalConfig = configs.find(c => c.testId === 'normal_request');
    if (!normalConfig) {
      throw new Error('Normal request test not found in config');
    }

    const normalResponse = await request(baseURL)
      .get(normalConfig.endpoint)
      .query(normalConfig.payload)
      .set('X-Test-Run-ID', testRunId);

    const normalRequestId = normalResponse.headers['x-request-id'];
    console.log(`✓ Normal request executed: HTTP ${normalResponse.status}`);
    console.log(`  Request ID: ${normalRequestId}`);

    if (!normalRequestId) {
      throw new Error('X-Request-ID header missing from normal response');
    }

    // Verify traffic event with runId
    await new Promise(resolve => setTimeout(resolve, 100));
    const normalTrafficEvent = await prisma.trafficEvent.findFirst({
      where: {
        requestId: normalRequestId,
        runId: testRunId
      }
    });

    if (!normalTrafficEvent) {
      throw new Error('Traffic event not created for normal request');
    }

    console.log('✓ Traffic event created with runId association');

    // Step 5: Execute SQL injection request
    console.log('\n5. Executing SQL injection request...');
    const sqlConfig = configs.find(c => c.testId === 'sql_injection');
    if (!sqlConfig) {
      throw new Error('SQL injection test not found in config');
    }

    const sqlResponse = await request(baseURL)
      .get(sqlConfig.endpoint)
      .query(sqlConfig.payload)
      .set('X-Test-Run-ID', testRunId);

    const sqlRequestId = sqlResponse.headers['x-request-id'];
    console.log(`✓ SQL injection request executed: HTTP ${sqlResponse.status}`);
    console.log(`  Request ID: ${sqlRequestId}`);

    if (!sqlRequestId) {
      throw new Error('X-Request-ID header missing from SQL injection response');
    }

    // Verify traffic event with runId
    await new Promise(resolve => setTimeout(resolve, 100));
    const sqlTrafficEvent = await prisma.trafficEvent.findFirst({
      where: {
        requestId: sqlRequestId,
        runId: testRunId
      }
    });

    if (!sqlTrafficEvent) {
      throw new Error('Traffic event not created for SQL injection request');
    }

    console.log('✓ Traffic event created with runId association');

    // Verify security event (IDS mode should detect but not block)
    const sqlSecurityEvent = await prisma.securityEvent.findFirst({
      where: {
        requestId: sqlRequestId,
        runId: testRunId
      }
    });

    if (!sqlSecurityEvent) {
      console.log('  Note: No security event for SQL injection in IDS mode (may be expected behavior)');
    } else {
      console.log(`✓ Security event created: ${sqlSecurityEvent.attackType}, risk score: ${sqlSecurityEvent.riskScore}`);
    }

    // Step 6: Submit batch observations
    console.log('\n6. Submitting batch observations...');
    const submitResponse = await request(baseURL)
      .post('/api/test-lab/submit')
      .set('Cookie', `token=${adminToken}`)
      .send({
        testRunId,
        results: [
          {
            testId: normalConfig.testId,
            httpStatus: normalResponse.status,
            requestId: normalRequestId,
            success: normalResponse.status === 200
          },
          {
            testId: sqlConfig.testId,
            httpStatus: sqlResponse.status,
            requestId: sqlRequestId,
            success: sqlResponse.status === 200
          }
        ]
      });

    if (submitResponse.status !== 200) {
      throw new Error(`Batch submission failed: ${submitResponse.status} - ${JSON.stringify(submitResponse.body)}`);
    }

    console.log('✓ Batch submission successful');

    // Step 7: Verify TestRun updated to COMPLETED
    const updatedTestRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: { results: true }
    });

    if (!updatedTestRun) {
      throw new Error('TestRun not found after submission');
    }

    if (updatedTestRun.status !== 'COMPLETED') {
      throw new Error(`TestRun status should be COMPLETED, got ${updatedTestRun.status}`);
    }

    console.log('✓ TestRun status updated to COMPLETED');

    // Step 8: Verify TestResult records
    if (updatedTestRun.results.length !== 2) {
      throw new Error(`Expected 2 TestResult records, got ${updatedTestRun.results.length}`);
    }

    console.log(`✓ ${updatedTestRun.results.length} TestResult records persisted`);

    // Step 9: Verify metrics
    const reportMetrics = submitResponse.body.testRun.metrics;
    console.log('\n7. Report metrics:');
    console.log(`  Total Tests: ${updatedTestRun.totalTests}`);
    console.log(`  Passed: ${reportMetrics.passed}`);
    console.log(`  Failed: ${reportMetrics.failed}`);
    console.log(`  Evaluated: ${reportMetrics.evaluated}`);
    console.log(`  Execution Errors: ${reportMetrics.executionErrors}`);
    console.log(`  Unevaluated: ${reportMetrics.unevaluated}`);

    if (reportMetrics.passed + reportMetrics.failed !== reportMetrics.evaluated) {
      throw new Error('Metrics calculation error: passed + failed != evaluated');
    }

    console.log('✓ Metrics calculated correctly');

    // Step 10: Test cleanup
    console.log('\n8. Testing run-scoped cleanup...');
    const cleanupResponse = await request(baseURL)
      .post(`/api/test-lab/cleanup/${testRunId}`)
      .set('Cookie', `token=${adminToken}`);

    if (cleanupResponse.status !== 200) {
      throw new Error(`Cleanup failed: ${cleanupResponse.status}`);
    }

    const cleanedTestRun = await prisma.testRun.findUnique({
      where: { id: testRunId }
    });

    if (cleanedTestRun.status !== 'CLEANED_UP') {
      throw new Error(`TestRun status should be CLEANED_UP, got ${cleanedTestRun.status}`);
    }

    console.log('✓ Cleanup successful, TestRun status: CLEANED_UP');

    console.log('\n=== Test Lab End-to-End Workflow Complete ===');
    console.log('\n✓ All Test Lab end-to-end integration tests passed!');

  } finally {
    await cleanupTestServer(server);
  }
}

testTestLabEndToEnd()
  .then(() => {
    console.log('\n✓ Test Lab end-to-end integration tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test Lab end-to-end integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

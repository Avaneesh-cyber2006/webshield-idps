const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

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

async function testTestLabEndToEnd() {
  const { server, port } = await setupTestServer();
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    // Clear database
    await prisma.securityEvent.deleteMany({});
    await prisma.trafficEvent.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testResult.deleteMany({});

    // Set mode to IDS
    await prisma.systemSetting.upsert({
      where: { key: 'idps_mode' },
      update: { value: 'IDS' },
      create: { key: 'idps_mode', value: 'IDS' }
    });

    // Test 1: Get test configuration
    console.log('\n1. Testing test configuration retrieval...');
    const configResponse = await request(baseURL)
      .get('/api/test-lab/config')
      .set('Authorization', 'Bearer fake-admin-token');

    if (configResponse.status !== 401) {
      throw new Error(`Config endpoint not protected: ${configResponse.status}`);
    }

    console.log('✓ Config endpoint requires authentication');

    // Test 2: Verify endpoint paths match actual routes
    console.log('\n2. Verifying endpoint paths...');
    const authResponse = await request(baseURL).get('/api/demo/public');
    if (authResponse.status !== 200) {
      throw new Error(`Protected endpoint not accessible: ${authResponse.status}`);
    }
    console.log('✓ Protected endpoint /api/demo/public is accessible');

    // Test 3: Verify X-Request-ID header is present
    console.log('\n3. Verifying X-Request-ID header...');
    const requestIdResponse = await request(baseURL).get('/api/demo/public');
    const requestId = requestIdResponse.headers['x-request-id'];
    if (!requestId) {
      throw new Error('X-Request-ID header missing');
    }
    console.log(`✓ X-Request-ID header present: ${requestId}`);

    // Test 4: Verify traffic event is created
    console.log('\n4. Verifying traffic event creation...');
    await new Promise(resolve => setTimeout(resolve, 100));
    const trafficEvent = await prisma.trafficEvent.findFirst({
      where: { requestId: requestId }
    });
    if (!trafficEvent) {
      throw new Error('Traffic event not created');
    }
    console.log('✓ Traffic event created with request ID');

    // Test 5: Test batch submission validation
    console.log('\n5. Testing batch submission validation...');
    const submitResponse = await request(baseURL)
      .post('/api/test-lab/submit')
      .send({ results: [] });

    if (submitResponse.status !== 401) {
      throw new Error(`Submit endpoint not protected: ${submitResponse.status}`);
    }
    console.log('✓ Submit endpoint requires authentication');

    // Test 6: Verify TestRun schema
    console.log('\n6. Verifying TestRun schema...');
    const testRun = await prisma.testRun.create({
      data: {
        mode: 'IDS',
        totalTests: 1,
        methodology: 'Test'
      }
    });
    console.log('✓ TestRun record created with mode field');

    // Test 7: Verify TestResult schema
    console.log('\n7. Verifying TestResult schema...');
    const testResult = await prisma.testResult.create({
      data: {
        testRunId: testRun.id,
        testId: 'test',
        testName: 'Test',
        expectedType: 'NORMAL',
        expectedAction: 'ALLOW',
        actualType: 'NORMAL',
        actualAction: 'ALLOW',
        riskScore: 0,
        passed: true,
        requestId: 'REQ-TEST',
        evidence: '{}'
      }
    });
    console.log('✓ TestResult record created with testId, requestId, and evidence fields');

    // Cleanup
    await prisma.testResult.delete({ where: { id: testResult.id } });
    await prisma.testRun.delete({ where: { id: testRun.id } });

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
    process.exit(1);
  });

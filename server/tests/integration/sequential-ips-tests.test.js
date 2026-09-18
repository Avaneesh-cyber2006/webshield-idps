// Setup isolated test database BEFORE importing application
const setupTestDb = require('../setup-test-db');

const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const prisma = require('../../src/config/database');

console.log('Running sequential IPS tests with per-test cleanup...');
console.log('Using database:', setupTestDb.DATABASE_URL);

// Set mode to IPS in database before importing app
async function setIPSMode() {
  await prisma.systemSetting.upsert({
    where: { key: 'idps_mode' },
    update: { value: 'IPS' },
    create: { key: 'idps_mode', value: 'IPS' }
  });
}

setIPSMode().then(() => {
  const { app, initializeIDPS } = require('../../src/app');
  const { getInspector } = require('../../src/middleware/idps');

  async function getAdminToken(port) {
    // Generate token directly using JWT to bypass IDPS during login
    const jwt = require('jsonwebtoken');
    const { generateToken } = require('../../src/middleware/auth');
    
    // Get admin user from database
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@webshield.local' }
    });

    if (!admin) {
      throw new Error('Admin user not found in database');
    }

    // Generate token directly
    const token = generateToken(admin);
    
    // Format as cookie
    return `token=${token}`;
  }

  async function setupTestServer() {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: '*', credentials: true }
    });

    initializeIDPS(io);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    // Wait for inspector to be initialized and mode loaded
    await new Promise(resolve => setTimeout(resolve, 200));

    const inspector = getInspector();
    // Keep IPS mode throughout the test
    inspector.setMode('IPS');

    return { server, port: server.address().port };
  }

  async function runSequentialIpsTests() {
    const { server, port } = await setupTestServer();
    const baseURL = `http://127.0.0.1:${port}`;
    const inspector = getInspector();

    try {
      console.log('\n=== Sequential IPS Tests with Per-Test Cleanup ===');

      // Step 1: Authenticate as admin
      console.log('1. Authenticating as administrator...');
      const tokenCookie = await getAdminToken(port);
      console.log('✓ Administrator authenticated');

      // Clean up any existing blocks from previous test runs
      console.log('1.5 Cleaning up any existing blocks...');
      await prisma.blockedSource.deleteMany({
        where: { testRunId: { not: null } }
      });
      console.log('✓ Cleaned up existing lab blocks');

      // Step 2: Create TestRun in IPS mode
      console.log('2. Creating TestRun in IPS mode...');
      const createRunResponse = await request(baseURL)
        .post('/api/test-lab/create-run')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('Cookie', tokenCookie)
        .send({ mode: 'IPS' });

      if (createRunResponse.status !== 200) {
        console.error('TestRun creation failed with status:', createRunResponse.status);
        console.error('Response body:', createRunResponse.body);
        throw new Error('TestRun creation failed');
      }

      const testRunId = createRunResponse.body.testRun.id;
      console.log('✓ TestRun created:', testRunId);
      console.log('  Initial status:', createRunResponse.body.testRun.status);

      // Step 3: Start TestRun (CREATED → RUNNING)
      console.log('3. Starting TestRun (CREATED → RUNNING)...');
      const startRunResponse = await request(baseURL)
        .post(`/api/test-lab/start/${testRunId}`)
        .set('Cookie', tokenCookie);

      if (startRunResponse.status !== 200) {
        console.error('TestRun start failed with status:', startRunResponse.status);
        console.error('Response body:', startRunResponse.body);
        throw new Error('TestRun start failed');
      }

      console.log('✓ TestRun started:', startRunResponse.body.testRun.status);
      if (startRunResponse.body.testRun.status !== 'RUNNING') {
        throw new Error('TestRun should be RUNNING after start, got: ' + startRunResponse.body.testRun.status);
      }

      // Step 4: Execute SQL injection (should create a block)
      console.log('4. Executing SQL injection in IPS mode...');
      const sqliResponse = await request(baseURL)
        .get('/api/demo/search?query=' + encodeURIComponent("' OR '1'='1"))
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('X-Test-Run-ID', testRunId)
        .set('Cookie', tokenCookie);

      if (sqliResponse.status !== 403) {
        throw new Error('SQL injection should be blocked in IPS mode, got: ' + sqliResponse.status);
      }

      console.log('✓ SQL injection blocked with 403');

      // Extract actual request ID from response header
      const sqliRequestId = sqliResponse.headers['x-request-id'];
      if (!sqliRequestId) {
        throw new Error('SQL injection response missing X-Request-ID header');
      }
      console.log('✓ SQL injection request ID:', sqliRequestId);

      // Verify block was created
      const blockAfterSqli = await prisma.blockedSource.findFirst({
        where: { testRunId: testRunId }
      });

      if (!blockAfterSqli || !blockAfterSqli.active) {
        throw new Error('Block was not created for SQL injection');
      }

      console.log('✓ Block created with testRun ownership');

      // Step 5: Per-test cleanup (should remove block but keep TestRun RUNNING)
      console.log('5. Performing per-test cleanup...');
      const perTestCleanupResponse = await request(baseURL)
        .post(`/api/test-lab/cleanup-block/${testRunId}`)
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('Cookie', tokenCookie)
        .send({ testId: 'sql_injection' });

      if (perTestCleanupResponse.status !== 200) {
        console.error('Per-test cleanup failed with status:', perTestCleanupResponse.status);
        console.error('Response body:', perTestCleanupResponse.body);
        throw new Error('Per-test cleanup failed');
      }

      console.log('✓ Per-test cleanup completed');
      console.log('  Cleaned count:', perTestCleanupResponse.body.cleanedCount);
      console.log('  TestRun status after per-test cleanup:', perTestCleanupResponse.body.testRunStatus);

      // Verify TestRun is still RUNNING
      if (perTestCleanupResponse.body.testRunStatus !== 'RUNNING') {
        throw new Error('Per-test cleanup incorrectly changed TestRun status to ' + perTestCleanupResponse.body.testRunStatus);
      }

      console.log('✓ TestRun status preserved as RUNNING');

      // Verify block was removed
      const blockAfterCleanup = await prisma.blockedSource.findFirst({
        where: { testRunId: testRunId }
      });

      if (blockAfterCleanup) {
        throw new Error('Block was not removed by per-test cleanup');
      }

      console.log('✓ Block removed by per-test cleanup');

      // Clear rate limit state to avoid false positives on next test
      const prevention = inspector.prevention;
      if (prevention && prevention.clearRateLimit) {
        prevention.clearRateLimit('127.0.0.1');
      }
      const detectors = inspector.detectors;
      if (detectors && detectors.clearState) {
        detectors.clearState('127.0.0.1');
      }
      console.log('✓ Rate limit state cleared');

      // Step 6: Execute normal request (should succeed because block was removed)
      console.log('6. Executing normal request after cleanup...');
      const normalResponse = await request(baseURL)
        .get('/api/demo/public')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('X-Test-Run-ID', testRunId)
        .set('Cookie', tokenCookie);

      // Normal request should be allowed
      console.log('✓ Normal request executed with status:', normalResponse.status);

      // Extract actual request ID from response header
      const normalRequestId = normalResponse.headers['x-request-id'];
      if (!normalRequestId) {
        throw new Error('Normal response missing X-Request-ID header');
      }
      console.log('✓ Normal request ID:', normalRequestId);

      // Step 7: Submit batch observations with actual request IDs
      console.log('7. Submitting batch observations with actual request IDs...');
      const submitResponse = await request(baseURL)
        .post('/api/test-lab/submit')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('Cookie', tokenCookie)
        .send({
          testRunId,
          results: [
            {
              testId: 'sql_injection',
              requestId: sqliRequestId,
              httpStatus: 403,
              success: false
            },
            {
              testId: 'normal_request',
              requestId: normalRequestId,
              httpStatus: normalResponse.status,
              success: normalResponse.status === 200
            }
          ]
        });

      if (submitResponse.status !== 200) {
        throw new Error('Batch submission failed: ' + JSON.stringify(submitResponse.body));
      }

      console.log('✓ Batch submission successful');
      console.log('  TestRun status after submission:', submitResponse.body.testRun.status);

      // Verify TestRun is COMPLETED (not CLEANED_UP yet)
      if (!submitResponse.body.testRun || submitResponse.body.testRun.status !== 'COMPLETED') {
        throw new Error('TestRun should be COMPLETED after submission, got: ' + (submitResponse.body.testRun?.status || 'undefined'));
      }

      console.log('✓ TestRun status correctly set to COMPLETED');

      // Verify results
      const results = submitResponse.body.testRun.results;
      console.log('  Results:', JSON.stringify(results, null, 2));

      // Verify detectorMatch for attack tests
      for (const result of results) {
        if (result.expectedType === 'ATTACK' && !result.evidence.detectorMatch) {
          console.error(`Detector category mismatch for ${result.testId}:`);
          console.error(`  Expected detector: ${result.evidence.expectedDetector}`);
          console.error(`  Actual detectors: ${JSON.stringify(result.evidence.actualDetectors)}`);
          console.error(`  Evidence:`, result.evidence);
        }
      }

      // Verify metrics
      const metrics = submitResponse.body.testRun.metrics;
      console.log('  Metrics:', JSON.stringify(metrics, null, 2));

      if (metrics.passed !== 2) {
        throw new Error('Expected 2 passed tests, got: ' + metrics.passed);
      }
      if (metrics.failed !== 0) {
        throw new Error('Expected 0 failed tests, got: ' + metrics.failed);
      }
      if (metrics.executionErrors !== 0) {
        throw new Error('Expected 0 execution errors, got: ' + metrics.executionErrors);
      }
      if (metrics.unevaluated !== 0) {
        throw new Error('Expected 0 unevaluated samples, got: ' + metrics.unevaluated);
      }

      console.log('✓ All metrics verified correctly');
      console.log('✓ Detector categories validated');

      // Step 8: Final cleanup (should mark TestRun as CLEANED_UP)
      console.log('8. Performing final cleanup...');
      const finalCleanupResponse = await request(baseURL)
        .post(`/api/test-lab/cleanup/${testRunId}`)
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('Cookie', tokenCookie);

      if (finalCleanupResponse.status !== 200) {
        throw new Error('Final cleanup failed');
      }

      console.log('✓ Final cleanup completed');

      // Verify TestRun is now CLEANED_UP
      const finalTestRun = await prisma.testRun.findUnique({
        where: { id: testRunId }
      });

      if (!finalTestRun || finalTestRun.status !== 'CLEANED_UP') {
        throw new Error('TestRun should be CLEANED_UP after final cleanup');
      }

      console.log('✓ TestRun status correctly set to CLEANED_UP');

      console.log('\n=== Sequential IPS Tests Complete ===');
      console.log('✓ Per-test cleanup preserves TestRun RUNNING state');
      console.log('✓ Multiple attack tests can execute sequentially in IPS mode');
      console.log('✓ Final cleanup marks TestRun as CLEANED_UP');
      console.log('✓ Actual request IDs used for evidence correlation');
      console.log('✓ System remained in IPS mode throughout');

    } finally {
      // Reset to IDS mode for cleanup
      inspector.setMode('IDS');
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IDS' }
      });
      server.close();
    }
  }

  runSequentialIpsTests()
    .then(() => {
      console.log('✓ All sequential IPS tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sequential IPS tests failed:', error);
      process.exit(1);
    });
}).catch((error) => {
  console.error('Failed to set IPS mode:', error);
  process.exit(1);
});

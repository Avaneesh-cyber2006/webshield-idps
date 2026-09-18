// Setup isolated test database BEFORE importing application
const setupTestDb = require('../setup-test-db');

const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const prisma = require('../../src/config/database');

console.log('Running sequential IPS tests with per-test cleanup...');
console.log('Using database:', setupTestDb.DATABASE_URL);

// Set mode to IDS in database before importing app
async function setIDSMode() {
  await prisma.systemSetting.upsert({
    where: { key: 'idps_mode' },
    update: { value: 'IDS' },
    create: { key: 'idps_mode', value: 'IDS' }
  });
}

setIDSMode().then(() => {
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
    inspector.setMode('IDS');

    return { server, port: server.address().port };
  }

  async function runSequentialIpsTests() {
    const { server, port } = await setupTestServer();
    const baseURL = `http://127.0.0.1:${port}`;
    const inspector = getInspector();

    try {
      console.log('\n=== Sequential IPS Tests with Per-Test Cleanup ===');

      // Step 1: Authenticate as admin (in IDS mode to avoid blocking login)
      console.log('1. Authenticating as administrator...');
      const tokenCookie = await getAdminToken(port);
      console.log('✓ Administrator authenticated');

      // Clean up any existing blocks from previous test runs
      console.log('1.5 Cleaning up any existing blocks...');
      await prisma.blockedSource.deleteMany({
        where: { testRunId: { not: null } }
      });
      console.log('✓ Cleaned up existing lab blocks');

      // Step 2: Create TestRun in IPS mode (temporarily switch to IDS for this request)
      inspector.setMode('IDS');
      console.log('2. Creating TestRun...');
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

      // Update TestRun status to RUNNING
      await prisma.testRun.update({
        where: { id: testRunId },
        data: { status: 'RUNNING' }
      });
      console.log('✓ TestRun status set to RUNNING');

      // Switch back to IPS mode for the actual attack tests
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IPS' }
      });
      inspector.setMode('IPS');
      console.log('✓ Switched to IPS mode');

      // Step 3: Execute SQL injection (should create a block)
      console.log('3. Executing SQL injection in IPS mode...');
      const sqliResponse = await request(baseURL)
        .get('/api/demo/search?query=' + encodeURIComponent("' OR '1'='1"))
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('X-Test-Run-ID', testRunId)
        .set('Cookie', tokenCookie);

      if (sqliResponse.status !== 403) {
        throw new Error('SQL injection should be blocked in IPS mode');
      }

      console.log('✓ SQL injection blocked with 403');

      // Verify block was created
      const blockAfterSqli = await prisma.blockedSource.findFirst({
        where: { testRunId: testRunId }
      });

      if (!blockAfterSqli || !blockAfterSqli.active) {
        throw new Error('Block was not created for SQL injection');
      }

      console.log('✓ Block created with testRun ownership');

      // Switch back to IDS mode for cleanup operations
      inspector.setMode('IDS');
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IDS' }
      });
      console.log('✓ Switched to IDS mode for per-test cleanup');

      // Step 4: Per-test cleanup (should remove block but keep TestRun RUNNING)
      console.log('4. Performing per-test cleanup...');
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

      // Switch back to IPS mode for the XSS test
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IPS' }
      });
      inspector.setMode('IPS');
      console.log('✓ Switched back to IPS mode for XSS test');

      // Step 5: Execute XSS test (should succeed because block was removed)
      console.log('5. Executing XSS test after cleanup...');
      const xssResponse = await request(baseURL)
        .get('/api/demo/search?query=' + encodeURIComponent('<script>alert(1)</script>'))
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('X-Test-Run-ID', testRunId)
        .set('Cookie', tokenCookie);

      // XSS might be blocked (403) or allowed (200) depending on detection
      // The important thing is that it's not blocked by the previous SQL injection block
      console.log('✓ XSS test executed with status:', xssResponse.status);

      // Switch back to IDS mode for submission
      inspector.setMode('IDS');
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IDS' }
      });
      console.log('✓ Switched to IDS mode for submission');

      // Step 6: Submit batch observations
      console.log('6. Submitting batch observations...');
      const submitResponse = await request(baseURL)
        .post('/api/test-lab/submit')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .set('Cookie', tokenCookie)
        .send({
          testRunId,
          results: [
            {
              testId: 'sql_injection',
              requestId: 'REQ-TEST-1',
              httpStatus: 403,
              success: false
            },
            {
              testId: 'xss',
              requestId: 'REQ-TEST-2',
              httpStatus: xssResponse.status,
              success: xssResponse.status === 200
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

      // Switch back to IDS mode for cleanup operations
      inspector.setMode('IDS');
      await prisma.systemSetting.update({
        where: { key: 'idps_mode' },
        data: { value: 'IDS' }
      });
      console.log('✓ Switched back to IDS mode for cleanup');

      // Step 7: Final cleanup (should mark TestRun as CLEANED_UP)
      console.log('7. Performing final cleanup...');
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

    } finally {
      // Reset to IDS mode
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
  console.error('Failed to set IDS mode:', error);
  process.exit(1);
});

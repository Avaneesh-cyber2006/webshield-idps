const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

// Setup isolated test database
require('../setup-test-db');

console.log('Running IDPS integration tests...');

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

async function testSQLInjectionDetectionAndBlocking() {
  const { server, port } = await setupTestServer();
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    // Clear database mode setting to prevent override
    await prisma.systemSetting.deleteMany({ where: { key: 'idps_mode' } });

    // Get inspector and set to IPS mode
    const { getInspector } = require('../../src/middleware/idps');
    const inspector = getInspector();
    console.log('Inspector before mode set:', inspector ? 'exists' : 'null');
    console.log('Mode before set:', inspector ? inspector.getMode() : 'N/A');

    if (inspector) {
      inspector.setMode('IPS');
      console.log('Mode after set to IPS:', inspector.getMode());
    }

    // Clear existing security events
    await prisma.securityEvent.deleteMany({});

    // Test 1: SQL injection should be detected and blocked in IPS mode
    const response = await request(baseURL)
      .get('/api/demo/search?query=' + encodeURIComponent("' OR '1'='1"))
      .set('User-Agent', 'Mozilla/5.0');

    console.log('SQL injection response status:', response.status);
    console.log('SQL injection response body:', response.body);

    // In IPS mode, SQL injection should be blocked (403)
    if (response.status !== 403) {
      throw new Error(`SQL injection not blocked in IPS mode. Expected 403, got ${response.status}`);
    }

    // Wait a moment for database writes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify security event was created (could be BLOCKED_SOURCE or SQL_INJECTION)
    const securityEvent = await prisma.securityEvent.findFirst({
      where: {
        OR: [
          { attackType: { contains: 'SQL' } },
          { attackType: 'BLOCKED_SOURCE' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!securityEvent) {
      throw new Error('No security event created for SQL injection');
    }

    if (securityEvent.riskScore === 0) {
      throw new Error('Security event has zero risk score for SQL injection');
    }

    if (securityEvent.action !== 'BLOCK' && securityEvent.action !== 'TEMP_BLOCK') {
      throw new Error(`Security event action was ${securityEvent.action}, expected BLOCK or TEMP_BLOCK`);
    }

    console.log('✓ SQL injection detected and blocked in IPS mode');

    // Clear blocked sources before normal request test
    await prisma.blockedSource.deleteMany({});

    // Test 2: Normal request should be allowed in IPS mode
    const normalResponse = await request(baseURL)
      .get('/api/demo/search?query=normal')
      .set('User-Agent', 'Mozilla/5.0');

    console.log('Normal request response status:', normalResponse.status);
    console.log('Normal request response body:', normalResponse.body);

    // Normal request should not be blocked (401 expected due to no auth, not 403)
    if (normalResponse.status === 403) {
      throw new Error('Normal request blocked in IPS mode (should be allowed)');
    }

    console.log('✓ Normal request allowed in IPS mode');

    // Test 3: Switch to IDS mode, SQL injection should be detected but not blocked
    if (inspector) {
      inspector.setMode('IDS');
      console.log('Mode after set to IDS:', inspector.getMode());
    }

    await prisma.securityEvent.deleteMany({});

    const idsResponse = await request(baseURL)
      .get('/api/demo/search?query=' + encodeURIComponent("' OR '1'='1"))
      .set('User-Agent', 'Mozilla/5.0');

    console.log('IDS mode SQL injection response status:', idsResponse.status);

    // In IDS mode, should be detected but not blocked (401 expected due to no auth)
    if (idsResponse.status === 403) {
      throw new Error('SQL injection blocked in IDS mode (should be detected but not blocked)');
    }

    // Verify security event was created in IDS mode
    const idsSecurityEvent = await prisma.securityEvent.findFirst({
      where: {
        attackType: { contains: 'SQL' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!idsSecurityEvent) {
      throw new Error('No security event created for SQL injection in IDS mode');
    }

    if (idsSecurityEvent.action === 'BLOCK' || idsSecurityEvent.action === 'TEMP_BLOCK') {
      throw new Error(`SQL injection blocked in IDS mode with action ${idsSecurityEvent.action}`);
    }

    console.log('✓ SQL injection detected but not blocked in IDS mode');

  } finally {
    await cleanupTestServer(server);
  }
}

testSQLInjectionDetectionAndBlocking()
  .then(() => {
    console.log('✓ All IDPS integration tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ IDPS integration test failed:', error.message);
    process.exit(1);
  });

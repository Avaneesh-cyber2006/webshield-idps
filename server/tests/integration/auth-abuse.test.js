const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

// Setup isolated test database
require('../setup-test-db');

console.log('Running authentication abuse detection integration tests...');

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

async function testAuthFailureDetection() {
  const { server, port } = await setupTestServer();
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    // Clear database mode setting
    await prisma.systemSetting.deleteMany({ where: { key: 'idps_mode' } });

    // Get inspector and set to IPS mode
    const { getInspector } = require('../../src/middleware/idps');
    const inspector = getInspector();
    if (inspector) {
      inspector.setMode('IPS');
    }

    // Disable suspicious UA detector for this test
    if (inspector && inspector.detectors) {
      inspector.detectors.setDetectorEnabled('Suspicious User-Agent Detection', false);
    }

    // Clear existing security events
    await prisma.securityEvent.deleteMany({});

    // Test 1: Single failed login should be detected as auth failure
    // Send 3 failed logins to trigger auth abuse detector (threshold = 3)
    for (let i = 0; i < 3; i++) {
      const failedLogin = await request(baseURL)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' });

      if (failedLogin.status !== 401) {
        throw new Error(`Failed login ${i+1} returned ${failedLogin.status} instead of 401`);
      }
    }

    console.log('3 failed logins sent');

    // Wait for response-finish handler to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for any security events
    const allEvents = await prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('Recent security events:', allEvents.map(e => ({ type: e.attackType, score: e.riskScore, action: e.action })));

    const authEvent = await prisma.securityEvent.findFirst({
      where: {
        attackType: { contains: 'AUTH' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!authEvent) {
      throw new Error('No auth failure event created for repeated failed logins');
    }

    if (authEvent.riskScore === 0) {
      throw new Error('Auth failure event has zero risk score');
    }

    console.log('✓ Repeated failed logins detected as auth abuse');

    // Test 2: Repeated failed logins should trigger login abuse detection
    await prisma.securityEvent.deleteMany({});

    for (let i = 0; i < 6; i++) {
      await request(baseURL)
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' });
    }

    // Wait for detection to process
    await new Promise(resolve => setTimeout(resolve, 300));

    const loginAbuseEvent = await prisma.securityEvent.findFirst({
      where: {
        attackType: { contains: 'ABUSE' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!loginAbuseEvent) {
      throw new Error('No login abuse event created for repeated failed logins');
    }

    if (loginAbuseEvent.riskScore === 0) {
      throw new Error('Login abuse event has zero risk score');
    }

    console.log('✓ Repeated failed logins triggered login abuse detection');

    // Test 3: Successful login should not be flagged as attack
    await prisma.securityEvent.deleteMany({});

    const successLogin = await request(baseURL)
      .post('/api/auth/login')
      .send({ email: 'user@webshield.local', password: 'user123' });

    if (successLogin.status !== 200) {
      throw new Error(`Successful login returned ${successLogin.status} instead of 200`);
    }

    // Wait for response-finish handler
    await new Promise(resolve => setTimeout(resolve, 200));

    const noAttackEvent = await prisma.securityEvent.findFirst({
      where: {
        riskScore: { gt: 0 }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (noAttackEvent) {
      throw new Error('Attack event created for successful login');
    }

    console.log('✓ Successful login not flagged as attack');

  } finally {
    await cleanupTestServer(server);
  }
}

testAuthFailureDetection()
  .then(() => {
    console.log('✓ All authentication abuse detection tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Authentication abuse detection test failed:', error.message);
    process.exit(1);
  });

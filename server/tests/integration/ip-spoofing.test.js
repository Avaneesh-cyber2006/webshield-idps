// Setup isolated test database BEFORE importing application
const setupTestDb = require('../setup-test-db');

const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

console.log('Running IP spoofing regression tests...');
console.log('Using database:', setupTestDb.DATABASE_URL);

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

async function testIPSpoofingPrevention() {
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

    // Clear existing security events and blocked sources
    await prisma.securityEvent.deleteMany({});
    await prisma.blockedSource.deleteMany({});

    // Test 1: Request with spoofed X-Forwarded-For header should be ignored
    const spoofedResponse = await request(baseURL)
      .get('/api/demo/search?query=' + encodeURIComponent("' OR '1'='1"))
      .set('User-Agent', 'Mozilla/5.0')
      .set('X-Forwarded-For', '192.168.1.999'); // Invalid IP

    // Should still be blocked based on actual socket IP (127.0.0.1)
    if (spoofedResponse.status !== 403) {
      throw new Error(`Spoofed IP request not blocked. Expected 403, got ${spoofedResponse.status}`);
    }

    // Verify security event shows actual socket IP, not spoofed IP
    await new Promise(resolve => setTimeout(resolve, 100));

    const securityEvent = await prisma.securityEvent.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!securityEvent) {
      throw new Error('No security event created for spoofed IP test');
    }

    if (securityEvent.sourceIp === '192.168.1.999') {
      throw new Error('Security event shows spoofed IP instead of actual socket IP');
    }

    if (securityEvent.sourceIp !== '127.0.0.1') {
      throw new Error(`Security event shows IP ${securityEvent.sourceIp} instead of actual socket IP 127.0.0.1`);
    }

    console.log('✓ Spoofed X-Forwarded-For header ignored, actual socket IP used');

    // Clear blocked sources before next test
    await prisma.blockedSource.deleteMany({});

    // Test 2: Request with multiple X-Forwarded-For values should use first value only if trusted proxy is configured
    // Since TRUSTED_PROXY is not set, it should use socket IP
    const multiSpoofedResponse = await request(baseURL)
      .get('/api/demo/search?query=normal')
      .set('User-Agent', 'Mozilla/5.0')
      .set('X-Forwarded-For', '10.0.0.1, 192.168.1.100, 8.8.8.8');

    if (multiSpoofedResponse.status === 403) {
      throw new Error('Normal request with spoofed IPs was blocked');
    }

    console.log('✓ Multiple X-Forwarded-For values ignored without trusted proxy');

    // Test 3: Normal request without spoofing headers
    const normalResponse = await request(baseURL)
      .get('/api/demo/search?query=normal')
      .set('User-Agent', 'Mozilla/5.0');

    if (normalResponse.status === 403) {
      throw new Error('Normal request without spoofing was blocked');
    }

    console.log('✓ Normal request without spoofing headers allowed');

    // Test 4: Explicit TRUSTED_PROXY=false test
    // Set environment variable explicitly and verify forwarded headers are ignored
    const originalTrustedProxy = process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY = 'false';

    const explicitSpoofResponse = await request(baseURL)
      .get('/api/demo/search?query=normal')
      .set('User-Agent', 'Mozilla/5.0')
      .set('X-Forwarded-For', '1.2.3.4')
      .set('X-Real-IP', '5.6.7.8')
      .set('X-Forwarded-Host', 'evil.com');

    if (explicitSpoofResponse.status === 403) {
      throw new Error('Normal request with multiple spoofed headers was blocked');
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const explicitTrafficEvent = await prisma.trafficEvent.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!explicitTrafficEvent) {
      throw new Error('No traffic event for explicit spoofed header test');
    }

    if (explicitTrafficEvent.sourceIp !== '127.0.0.1') {
      throw new Error(`TRUSTED_PROXY=false failed: expected 127.0.0.1, got ${explicitTrafficEvent.sourceIp}`);
    }

    console.log('✓ TRUSTED_PROXY=false: all forwarded headers ignored, socket IP used exclusively');

    // Restore original value
    process.env.TRUSTED_PROXY = originalTrustedProxy;

  } finally {
    await cleanupTestServer(server);
  }
}

testIPSpoofingPrevention()
  .then(() => {
    console.log('✓ All IP spoofing regression tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ IP spoofing regression test failed:', error.message);
    process.exit(1);
  });

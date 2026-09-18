const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

// Setup isolated test database
require('../setup-test-db');

console.log('Running rate-limit enforcement regression tests...');

async function setupTestServer() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', credentials: true }
  });

  initializeIDPS(io);

  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  return { server, port: server.address().port };
}

async function runRateLimitTests() {
  const { server, port } = await setupTestServer();

  try {
    // Clean up any existing blocks before testing
    const testIp = '127.0.0.1';
    await prisma.blockedSource.deleteMany({
      where: { sourceIp: testIp }
    });

    // Set mode to IPS for rate-limit prevention
    const inspector = require('../../src/middleware/idps').getInspector();
    inspector.setMode('IPS');

    console.log('\n=== Rate Limit Enforcement Test ===');
    console.log('Sending 49 legitimate requests (should all be allowed)...');

    // Send 49 requests (should all be allowed)
    for (let i = 0; i < 49; i++) {
      const response = await request(app)
        .get('/api/demo/public');

      if (response.status !== 200) {
        console.error(`Request ${i + 1} failed with status ${response.status}`);
        throw new Error(`Request ${i + 1} should be allowed but got ${response.status}`);
      }
    }

    console.log('✓ 49 requests allowed');

    console.log('Sending 50th request (should be rate-limited)...');

    // Send 50th request (should be rate-limited - detector triggers at >= 50)
    const response50 = await request(app)
      .get('/api/demo/public');

    if (response50.status !== 429) {
      console.error(`50th request should be rate-limited (429) but got ${response50.status}`);
      throw new Error('Rate limit not enforced correctly');
    }

    console.log('✓ 50th request rate-limited with 429 status');
    console.log('✓ Rate limit enforcement verified');

    console.log('\n=== Legitimate Traffic Test ===');
    console.log('Clearing rate limit state...');

    // Clear rate limit state for next test
    const prevention = inspector.prevention;
    if (prevention && prevention.clearRateLimit) {
      prevention.clearRateLimit(testIp);
    }

    // Also clear detector state
    const detectors = inspector.detectors;
    if (detectors && detectors.clearState) {
      detectors.clearState(testIp);
    }

    console.log('Sending request after clearing (should be allowed)...');

    // Request after clearing should be allowed
    const clearedResponse = await request(app)
      .get('/api/demo/public');

    if (clearedResponse.status !== 200) {
      console.error(`Request after clearing should be allowed but got ${clearedResponse.status}`);
      throw new Error('Rate limit not cleared correctly');
    }

    console.log('✓ Request after clearing allowed');
    console.log('✓ Legitimate traffic unaffected after state clear');

    console.log('\n=== All rate-limit enforcement tests passed ===');
  } finally {
    server.close();
  }
}

runRateLimitTests()
  .then(() => {
    console.log('✓ All rate-limit enforcement tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Rate-limit enforcement test failed:', error);
    process.exit(1);
  });

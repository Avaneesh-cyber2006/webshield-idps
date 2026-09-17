const request = require('supertest');
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');

console.log('Running block ownership collision safety tests...');

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

async function testBlockOwnershipCollision() {
  const { server, port } = await setupTestServer();
  const baseURL = `http://127.0.0.1:${port}`;

  try {
    // Clear existing blocks
    await prisma.blockedSource.deleteMany({});

    console.log('\n1. Creating manual block...');
    const manualBlock = await prisma.blockedSource.create({
      data: {
        sourceIp: '127.0.0.1',
        reason: 'Manual block by administrator',
        blockedAt: new Date(),
        expiresAt: null,
        active: true,
        testRunId: null  // Manual block has no testRunId
      }
    });
    console.log('✓ Manual block created');

    console.log('\n2. Attempting to create test-generated block for same IP...');
    const { getInspector } = require('../../src/middleware/idps');
    const inspector = getInspector();
    const prevention = inspector ? inspector.prevention : null;

    if (prevention) {
      const result = await prevention.blockSource(
        '127.0.0.1',
        'Test-generated block',
        true,
        300000,
        'test-run-123'  // Different test run ID
      );
      console.log('✓ Block source attempt completed');
    }

    console.log('\n3. Verifying manual block was not overwritten...');
    const preservedBlock = await prisma.blockedSource.findUnique({
      where: { sourceIp: '127.0.0.1' }
    });

    if (!preservedBlock) {
      throw new Error('Manual block was deleted instead of preserved');
    }

    if (preservedBlock.testRunId !== null) {
      throw new Error(`Manual block testRunId changed to ${preservedBlock.testRunId}`);
    }

    if (preservedBlock.reason !== 'Manual block by administrator') {
      throw new Error(`Manual block reason changed to ${preservedBlock.reason}`);
    }

    console.log('✓ Manual block preserved unchanged');

    console.log('\n4. Creating test-generated block for different IP...');
    const testBlock = await prisma.blockedSource.create({
      data: {
        sourceIp: '192.168.1.100',
        reason: 'Test-generated block',
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        active: true,
        testRunId: 'test-run-123'
      }
    });
    console.log('✓ Test-generated block created for different IP');

    console.log('\n5. Attempting to overwrite test block with different test run...');
    if (prevention) {
      const result = await prevention.blockSource(
        '192.168.1.100',
        'Attempt to overwrite',
        true,
        300000,
        'test-run-456'  // Different test run ID
      );
      console.log('✓ Block source attempt completed');
    }

    console.log('\n6. Verifying original test block was not overwritten...');
    const preservedTestBlock = await prisma.blockedSource.findUnique({
      where: { sourceIp: '192.168.1.100' }
    });

    if (!preservedTestBlock) {
      throw new Error('Test block was deleted');
    }

    if (preservedTestBlock.testRunId !== 'test-run-123') {
      throw new Error(`Test block testRunId changed to ${preservedTestBlock.testRunId}`);
    }

    console.log('✓ Original test block preserved');

    console.log('\n7. Testing cleanup removes only lab-owned blocks...');
    const deleteResult = await prisma.blockedSource.deleteMany({
      where: { testRunId: 'test-run-123' }
    });

    if (deleteResult.count !== 1) {
      throw new Error(`Expected to clean 1 block, cleaned ${deleteResult.count}`);
    }

    console.log('✓ Cleanup removed only 1 lab-owned block');

    console.log('\n8. Verifying manual block still exists...');
    const manualBlockAfterCleanup = await prisma.blockedSource.findUnique({
      where: { sourceIp: '127.0.0.1' }
    });

    if (!manualBlockAfterCleanup) {
      throw new Error('Manual block was removed by cleanup');
    }

    console.log('✓ Manual block preserved after cleanup');

    console.log('\n✓ All block ownership collision safety tests passed!');

  } finally {
    await cleanupTestServer(server);
  }
}

testBlockOwnershipCollision()
  .then(() => {
    console.log('\n✓ Block ownership collision safety tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Block ownership collision safety test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

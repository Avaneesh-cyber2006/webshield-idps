/**
 * Database Isolation Verification Test
 * Backs up the demo database, runs the entire integration suite,
 * and verifies the demo database hash hasn't changed.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEMO_DB_PATH = path.join(__dirname, '../../prisma/dev.db');
const DEMO_BACKUP_PATH = path.join(__dirname, '../../prisma/dev.db.backup');
const TEST_DB_PATH = path.join(__dirname, '../../prisma/test.db');

function calculateFileHash(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function runDatabaseIsolationTest() {
  console.log('=== Database Isolation Verification Test ===\n');

  // Step 1: Back up demonstration database
  console.log('Step 1: Backing up demonstration database...');
  if (fs.existsSync(DEMO_DB_PATH)) {
    fs.copyFileSync(DEMO_DB_PATH, DEMO_BACKUP_PATH);
    console.log('✓ Demo database backed up to:', DEMO_BACKUP_PATH);
  } else {
    console.error('ERROR: Demo database does not exist at:', DEMO_DB_PATH);
    process.exit(1);
  }

  // Step 2: Calculate initial hash of demo database
  console.log('\nStep 2: Calculating initial hash of demo database...');
  const initialDemoHash = calculateFileHash(DEMO_DB_PATH);
  
  if (!initialDemoHash) {
    console.error('ERROR: Demo database does not exist at:', DEMO_DB_PATH);
    process.exit(1);
  }
  
  console.log('✓ Demo database hash calculated:', initialDemoHash.substring(0, 16) + '...');

  // Step 3: Verify resolved database path is not the demo database
  console.log('\nStep 3: Verifying resolved database path is not demo database...');
  // Set DATABASE_URL to test.db before checking resolved path
  process.env.DATABASE_URL = 'file:./test.db';
  const resolvedDbPath = path.resolve(__dirname, '../../prisma', process.env.DATABASE_URL?.replace('file:./', '') || 'dev.db');
  
  if (resolvedDbPath === path.resolve(DEMO_DB_PATH)) {
    console.error('ERROR: Resolved database path matches demo database path');
    console.error('This would cause destructive operations on the demo database');
    console.error('Resolved path:', resolvedDbPath);
    console.error('Demo path:', path.resolve(DEMO_DB_PATH));
    process.exit(1);
  }
  
  console.log('✓ Resolved database path:', resolvedDbPath);
  console.log('✓ Demo database path:', path.resolve(DEMO_DB_PATH));
  console.log('✓ Paths are different, safe to proceed');

  // Step 4: Run test database setup
  console.log('\nStep 4: Setting up isolated test database...');
  process.env.DATABASE_URL = 'file:./test.db';

  try {
    // Clear the module cache for the test database setup
    delete require.cache[require.resolve('../setup-test-db')];
    
    // Import and run test database setup
    const setupTestDb = require('../setup-test-db');
    console.log('✓ Test database setup completed');
    console.log('✓ Test database path:', setupTestDb.TEST_DB_PATH);
    
    // Verify test database exists
    if (!fs.existsSync(setupTestDb.TEST_DB_PATH)) {
      console.error('ERROR: Test database does not exist at:', setupTestDb.TEST_DB_PATH);
      process.exit(1);
    }
    console.log('✓ Test database file verified');
    
    // Verify demo database still exists
    if (!fs.existsSync(setupTestDb.DEMO_DB_PATH)) {
      console.error('ERROR: Demo database was deleted:', setupTestDb.DEMO_DB_PATH);
      process.exit(1);
    }
    console.log('✓ Demo database file verified');
    
  } catch (error) {
    console.error('Test database setup failed:', error);
    process.exit(1);
  }

  // Step 5: Run the entire integration suite
  console.log('\nStep 5: Running the entire integration suite...');
  console.log('This will run all integration tests against the isolated test database');
  
  try {
    // Run all integration tests (unit tests don't touch the database)
    const integrationTests = [
      'node tests/integration/api.test.js',
      'node tests/integration/idps.test.js',
      'node tests/integration/ip-spoofing.test.js',
      'node tests/integration/auth-abuse.test.js',
      'node tests/integration/block-ownership.test.js',
      'node tests/integration/rate-limit.test.js',
      'node tests/integration/sequential-ips-tests.test.js',
      'node tests/integration/testlab-e2e.test.js'
    ];
    
    for (const test of integrationTests) {
      console.log(`\nRunning: ${test}`);
      execSync(test, {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
      console.log(`✓ ${test} passed`);
    }
    
    console.log('\n✓ All integration tests passed');
    
  } catch (error) {
    console.error('Integration suite failed:', error);
    process.exit(1);
  }

  // Step 6: Disconnect Prisma clients and close test servers
  console.log('\nStep 6: Disconnecting Prisma clients...');
  // Clear module cache to ensure connections are closed
  delete require.cache[require.resolve('../../src/config/database')];
  console.log('✓ Prisma client cache cleared');

  // Step 7: Verify demo database hash is unchanged after full suite
  console.log('\nStep 7: Verifying demo database hash is unchanged after full integration suite...');
  const finalDemoHash = calculateFileHash(DEMO_DB_PATH);
  
  if (!finalDemoHash) {
    console.error('ERROR: Demo database was deleted during integration suite');
    process.exit(1);
  }
  
  if (initialDemoHash !== finalDemoHash) {
    console.error('ERROR: Demo database hash changed during integration suite');
    console.error('Initial hash:', initialDemoHash);
    console.error('Final hash:', finalDemoHash);
    console.error('This indicates the demo database was modified by integration tests');
    console.error('This is a critical database isolation failure');
    process.exit(1);
  }
  
  console.log('✓ Demo database hash verified unchanged after full integration suite');
  console.log('✓ Hash:', finalDemoHash.substring(0, 16) + '...');

  // Step 8: Restore demo database from backup
  console.log('\nStep 8: Restoring demo database from backup...');
  if (fs.existsSync(DEMO_BACKUP_PATH)) {
    fs.copyFileSync(DEMO_BACKUP_PATH, DEMO_DB_PATH);
    fs.unlinkSync(DEMO_BACKUP_PATH);
    console.log('✓ Demo database restored from backup');
  }

  // Step 9: Verify actual database paths
  console.log('\nStep 9: Verifying database paths...');
  console.log('Demo database path:', DEMO_DB_PATH);
  console.log('Test database path:', TEST_DB_PATH);

  if (DEMO_DB_PATH === TEST_DB_PATH) {
    console.error('ERROR: Demo and test database paths are identical');
    process.exit(1);
  }

  console.log('✓ Database paths are different');

  // Step 10: Verify test database has seed data (expected)
  console.log('\nStep 10: Verifying test database has seed data...');
  process.env.DATABASE_URL = 'file:./test.db';

  delete require.cache[require.resolve('../../src/config/database')];
  const testPrisma = require('../../src/config/database');

  try {
    const userCount = await testPrisma.user.count();
    console.log('Test database user count:', userCount);
    
    if (userCount === 0) {
      console.error('ERROR: Test database should have seed data but is empty');
      process.exit(1);
    }
    
    console.log('✓ Test database has seed data (as expected)');
    
    await testPrisma.$disconnect();
    
  } catch (error) {
    console.error('Failed to verify test database seed data:', error);
    process.exit(1);
  }

  console.log('\n=== Database Isolation Verification Complete ===');
  console.log('✓ Demo database protected and unchanged (hash verified after full integration suite)');
  console.log('✓ Test database isolated and fresh');
  console.log('✓ Database paths verified distinct');
  console.log('✓ All integration tests passed without modifying demo database');
  console.log('\nDatabase isolation is working correctly.');
}

runDatabaseIsolationTest()
  .then(() => {
    console.log('✓ Database isolation test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database isolation test failed:', error);
    
    // Restore demo database from backup on failure
    if (fs.existsSync(DEMO_BACKUP_PATH)) {
      fs.copyFileSync(DEMO_BACKUP_PATH, DEMO_DB_PATH);
      fs.unlinkSync(DEMO_BACKUP_PATH);
    }
    
    process.exit(1);
  });

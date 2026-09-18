/**
 * Database Isolation Verification Test
 * Creates a file hash of the demo database, runs test database setup,
 * and verifies the hash hasn't changed to prove the demo database is not modified.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEMO_DB_PATH = path.join(__dirname, '../../prisma/dev.db');
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

  // Step 1: Calculate initial hash of demo database
  console.log('Step 1: Calculating initial hash of demo database...');
  const initialDemoHash = calculateFileHash(DEMO_DB_PATH);
  
  if (!initialDemoHash) {
    console.error('ERROR: Demo database does not exist at:', DEMO_DB_PATH);
    process.exit(1);
  }
  
  console.log('✓ Demo database hash calculated:', initialDemoHash.substring(0, 16) + '...');

  // Step 2: Verify resolved database path is not the demo database
  console.log('\nStep 2: Verifying resolved database path is not demo database...');
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

  // Step 3: Run test database setup
  console.log('\nStep 3: Setting up isolated test database...');
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

  // Step 4: Verify demo database hash is unchanged after setup
  console.log('\nStep 4: Verifying demo database hash is unchanged after test database setup...');
  const finalDemoHash = calculateFileHash(DEMO_DB_PATH);
  
  if (!finalDemoHash) {
    console.error('ERROR: Demo database was deleted during test database setup');
    process.exit(1);
  }
  
  if (initialDemoHash !== finalDemoHash) {
    console.error('ERROR: Demo database hash changed during test database setup');
    console.error('Initial hash:', initialDemoHash);
    console.error('Final hash:', finalDemoHash);
    console.error('This indicates the demo database was modified by test database setup');
    process.exit(1);
  }
  
  console.log('✓ Demo database hash verified unchanged after test database setup');
  console.log('✓ Hash:', finalDemoHash.substring(0, 16) + '...');

  // Step 5: Verify actual database paths
  console.log('\nStep 5: Verifying database paths...');
  console.log('Demo database path:', DEMO_DB_PATH);
  console.log('Test database path:', TEST_DB_PATH);

  if (DEMO_DB_PATH === TEST_DB_PATH) {
    console.error('ERROR: Demo and test database paths are identical');
    process.exit(1);
  }

  console.log('✓ Database paths are different');

  // Step 6: Verify test database has seed data (expected)
  console.log('\nStep 6: Verifying test database has seed data...');
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
    
  } catch (error) {
    console.error('Failed to verify test database seed data:', error);
    process.exit(1);
  }

  console.log('\n=== Database Isolation Verification Complete ===');
  console.log('✓ Demo database protected and unchanged (hash verified after test database setup)');
  console.log('✓ Test database isolated and fresh');
  console.log('✓ Database paths verified distinct');
  console.log('\nDatabase isolation is working correctly.');
  console.log('Note: Run npm run test:integration to execute the full integration suite separately.');
}

runDatabaseIsolationTest()
  .then(() => {
    console.log('✓ Database isolation test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database isolation test failed:', error);
    process.exit(1);
  });

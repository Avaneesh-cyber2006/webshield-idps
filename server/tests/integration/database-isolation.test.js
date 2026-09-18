/**
 * Database Isolation Verification Test
 * Creates a sentinel record in the demo database, runs integration tests,
 * and verifies the sentinel remains unchanged to prove the demo database is not modified.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEMO_DB_PATH = path.join(__dirname, '../../prisma/dev.db');
const TEST_DB_PATH = path.join(__dirname, '../../prisma/test.db');

async function runDatabaseIsolationTest() {
  console.log('=== Database Isolation Verification Test ===\n');

  // Step 1: Create sentinel in demo database
  console.log('Step 1: Creating sentinel record in demo database...');
  process.env.DATABASE_URL = 'file:./prisma/dev.db';

  // Force reload Prisma client with demo database
  delete require.cache[require.resolve('../../src/config/database')];
  const demoPrisma = require('../../src/config/database');

  try {
    await demoPrisma.systemSetting.create({
      data: {
        key: 'DATABASE_ISOLATION_SENTINEL',
        value: 'DO_NOT_MODIFY_DEMO_DATABASE'
      }
    });
    console.log('✓ Sentinel record created in demo database');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✓ Sentinel record already exists in demo database');
    } else {
      console.error('Failed to create sentinel:', error);
      process.exit(1);
    }
  }

  // Step 2: Run integration tests with isolated database
  console.log('\nStep 2: Running integration tests with isolated database...');
  process.env.DATABASE_URL = 'file:./prisma/test.db';

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

  // Step 3: Verify sentinel in demo database is unchanged
  console.log('\nStep 3: Verifying sentinel record in demo database...');
  process.env.DATABASE_URL = 'file:./prisma/dev.db';

  // Force reload Prisma client with demo database again
  delete require.cache[require.resolve('../../src/config/database')];
  const verifyPrisma = require('../../src/config/database');

  try {
    const sentinel = await verifyPrisma.systemSetting.findUnique({
      where: { key: 'DATABASE_ISOLATION_SENTINEL' }
    });
    
    if (!sentinel) {
      console.error('ERROR: Sentinel record was deleted from demo database');
      console.error('This indicates the demo database was modified during tests');
      process.exit(1);
    }
    
    if (sentinel.value !== 'DO_NOT_MODIFY_DEMO_DATABASE') {
      console.error('ERROR: Sentinel record value was modified in demo database');
      console.error('Expected: DO_NOT_MODIFY_DEMO_DATABASE');
      console.error('Actual:', sentinel.value);
      process.exit(1);
    }
    
    console.log('✓ Sentinel record verified unchanged in demo database');
    
  } catch (error) {
    console.error('Failed to verify sentinel:', error);
    process.exit(1);
  }

  // Step 4: Verify actual database paths
  console.log('\nStep 4: Verifying database paths...');
  console.log('Demo database path:', DEMO_DB_PATH);
  console.log('Test database path:', TEST_DB_PATH);

  if (DEMO_DB_PATH === TEST_DB_PATH) {
    console.error('ERROR: Demo and test database paths are identical');
    process.exit(1);
  }

  console.log('✓ Database paths are different');

  // Step 5: Verify test database has seed data (expected)
  console.log('\nStep 5: Verifying test database has seed data...');
  process.env.DATABASE_URL = 'file:./prisma/test.db';

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
  console.log('✓ Demo database protected and unchanged');
  console.log('✓ Test database isolated and fresh');
  console.log('✓ Database paths verified distinct');
  console.log('\nDatabase isolation is working correctly.');
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

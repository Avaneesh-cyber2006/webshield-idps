/**
 * Test Database Setup
 * Creates and initializes an isolated test database for integration tests
 * MUST be imported BEFORE importing the application or Prisma client
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TEST_DB_PATH = path.join(__dirname, '../prisma/test.db');
const DEMO_DB_PATH = path.join(__dirname, '../prisma/dev.db');

console.log('Setting up isolated test database...');

// Ensure we're not using the demo database
if (fs.existsSync(TEST_DB_PATH)) {
  console.log('Removing existing test database...');
  fs.unlinkSync(TEST_DB_PATH);
}

// Verify demo database exists and is protected
if (!fs.existsSync(DEMO_DB_PATH)) {
  console.error('ERROR: Demo database does not exist at:', DEMO_DB_PATH);
  console.error('Integration tests should not create the demo database.');
  process.exit(1);
}

console.log('✓ Demo database verified and protected');

// Set environment variable for test database BEFORE any Prisma client is created
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./prisma/test.db';

console.log('✓ Test database path configured:', process.env.DATABASE_URL);

// Apply migrations to test database WITHOUT running seed
console.log('Applying migrations to test database...');
try {
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('✓ Test database migrations applied');
} catch (error) {
  console.error('Failed to apply migrations to test database:', error);
  process.exit(1);
}

// Run seed on test database only
console.log('Seeding test database...');
try {
  execSync('node prisma/seed.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('✓ Test database seeded');
} catch (error) {
  console.error('Failed to seed test database:', error);
  process.exit(1);
}

// Verify the test database exists
if (!fs.existsSync(TEST_DB_PATH)) {
  console.error('ERROR: Test database was not created at:', TEST_DB_PATH);
  process.exit(1);
}

console.log('✓ Test database verified at:', TEST_DB_PATH);
console.log('✓ Test database setup complete');

// Export the resolved database path for verification
module.exports = {
  TEST_DB_PATH,
  DEMO_DB_PATH,
  DATABASE_URL: process.env.DATABASE_URL
};

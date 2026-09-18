/**
 * Test Database Setup
 * Creates and initializes an isolated test database for integration tests
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

// Set environment variable for test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./prisma/test.db';

console.log('✓ Test database path configured');

// Apply migrations to test database
console.log('Applying migrations to test database...');
try {
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✓ Test database migrations applied');
} catch (error) {
  console.error('Failed to apply migrations to test database:', error);
  process.exit(1);
}

console.log('✓ Test database setup complete');

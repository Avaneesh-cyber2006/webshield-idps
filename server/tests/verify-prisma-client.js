/**
 * Verify Prisma Client Configuration
 * Tests that Prisma Client actually uses DATABASE_URL from environment
 */
const fs = require('fs');
const path = require('path');

console.log('=== Prisma Client Configuration Verification ===\n');

// Step 1: Check the schema
console.log('Step 1: Checking Prisma schema...');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

if (schemaContent.includes('env("DATABASE_URL")') || schemaContent.includes('env(DATABASE_URL)')) {
  console.log('✓ Schema correctly uses env("DATABASE_URL")');
} else {
  console.error('ERROR: Schema does not use env("DATABASE_URL")');
  console.error('Schema content:');
  console.error(schemaContent);
  process.exit(1);
}

// Step 2: Check the database config
console.log('\nStep 2: Checking database config module...');
const configPath = path.join(__dirname, '../src/config/database');
delete require.cache[require.resolve(configPath)];
const prisma = require(configPath);

// Test with isolated database
process.env.DATABASE_URL = 'file:./prisma/test.db';
console.log('Set DATABASE_URL to:', process.env.DATABASE_URL);

// Reload with new DATABASE_URL
delete require.cache[require.resolve(configPath)];
const testPrisma = require(configPath);

// Try to verify it's using the right database by checking a sentinel
console.log('\nStep 3: Verifying Prisma Client uses DATABASE_URL...');
console.log('Note: This requires Prisma Client to be regenerated with DATABASE_URL set');

// Check if we can access the datasource
try {
  // This will fail if the database doesn't exist, but that's okay
  // We just want to see if it's trying to connect to the right place
  const datasourceUrl = testPrisma._engine?.datasourceUrl || 'unknown';
  console.log('Prisma Client datasource URL:', datasourceUrl);
  
  if (datasourceUrl.includes('test.db')) {
    console.log('✓ Prisma Client appears to use test.db');
  } else if (datasourceUrl.includes('dev.db')) {
    console.error('ERROR: Prisma Client is using dev.db instead of DATABASE_URL');
    console.error('This indicates Prisma Client was generated with a hardcoded path');
    process.exit(1);
  } else {
    console.log('Cannot determine datasource URL from client metadata');
  }
} catch (error) {
  console.log('Cannot inspect datasource URL (expected if Prisma Client not regenerated)');
}

console.log('\n=== Prisma Client Configuration Check Complete ===');
console.log('Note: To regenerate Prisma Client with DATABASE_URL, run:');
console.log('  set DATABASE_URL=file:./test.db && npx prisma generate');
console.log('  Or on Unix/Mac:');
console.log('  DATABASE_URL=file:./test.db npx prisma generate');

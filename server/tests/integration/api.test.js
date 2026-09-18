// Setup isolated test database BEFORE importing application
const setupTestDb = require('../setup-test-db');

const assert = require('assert')
const request = require('supertest')
const { app } = require('../../src/app')

async function runApiTests() {
  console.log('Running API integration tests...')
  console.log('Using database:', setupTestDb.DATABASE_URL)

  // Test 1: Health check
  const response1 = await request(app).get('/health')
  assert.strictEqual(response1.status, 200, 'API: health check should return 200')
  assert.strictEqual(response1.body.success, true)
  assert.strictEqual(response1.body.status, 'healthy')

  // Test 2: Public endpoint
  const response2 = await request(app).get('/api/public')
  assert.strictEqual(response2.status, 200, 'API: public endpoint should return 200')
  assert.strictEqual(response2.body.success, true)

  // Test 3: Protected endpoint without auth
  const response3 = await request(app).get('/api/demo/dashboard')
  assert.strictEqual(response3.status, 401, 'API: protected endpoint should reject unauthenticated')

  // Test 4: Invalid login
  const response4 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'invalid@test.com', password: 'wrong' })
  assert.strictEqual(response4.status, 401, 'API: should reject invalid login')

  console.log('✓ All API integration tests passed!')
}

runApiTests().catch(console.error)

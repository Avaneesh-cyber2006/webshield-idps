const assert = require('assert')
const RiskScoringEngine = require('../../src/idps/scoring/engine')

console.log('Running risk scoring tests...')

const engine = new RiskScoringEngine()

// Test 1: No detections
const result1 = engine.calculate([])
assert.strictEqual(result1.score, 0, 'Risk scoring: should return 0 for no detections')
assert.strictEqual(result1.severity, 'LOW')
assert.strictEqual(result1.categories.length, 0)

// Test 2: Single detection
const result2 = engine.calculate([
  { category: 'SQL_INJECTION', severity: 'HIGH', score: 40 }
])
assert.strictEqual(result2.score, 40, 'Risk scoring: should calculate single detection')
assert.strictEqual(result2.severity, 'HIGH')
assert.ok(result2.categories.includes('SQL_INJECTION'))

// Test 3: Multiple detections
const result3 = engine.calculate([
  { category: 'SQL_INJECTION', severity: 'HIGH', score: 40 },
  { category: 'XSS', severity: 'HIGH', score: 35 }
])
assert.strictEqual(result3.score, 75, 'Risk scoring: should combine scores')
assert.strictEqual(result3.severity, 'CRITICAL')

// Test 4: Score capping
const result4 = engine.calculate([
  { category: 'SQL_INJECTION', severity: 'HIGH', score: 40 },
  { category: 'XSS', severity: 'HIGH', score: 35 },
  { category: 'PATH_TRAVERSAL', severity: 'HIGH', score: 30 }
])
assert.strictEqual(result4.score, 100, 'Risk scoring: should cap at 100')

// Test 5: Severity levels
assert.strictEqual(engine.getSeverity(10), 'LOW', 'Risk scoring: should determine LOW severity')
assert.strictEqual(engine.getSeverity(25), 'MEDIUM', 'Risk scoring: should determine MEDIUM severity')
assert.strictEqual(engine.getSeverity(50), 'HIGH', 'Risk scoring: should determine HIGH severity')
assert.strictEqual(engine.getSeverity(85), 'CRITICAL', 'Risk scoring: should determine CRITICAL severity')

// Test 6: Unique categories
const result6 = engine.calculate([
  { category: 'SQL_INJECTION', severity: 'HIGH', score: 40 },
  { category: 'SQL_INJECTION', severity: 'HIGH', score: 40 },
  { category: 'XSS', severity: 'HIGH', score: 35 }
])
assert.strictEqual(result6.categories.length, 2, 'Risk scoring: should collect unique categories')
assert.ok(result6.categories.includes('SQL_INJECTION'))
assert.ok(result6.categories.includes('XSS'))

console.log('✓ All risk scoring tests passed!')

const assert = require('assert')
const DecisionEngine = require('../../src/idps/prevention/decision')

console.log('Running decision engine tests...')

const engine = new DecisionEngine()

// Test 1: Start in IDS mode
assert.strictEqual(engine.getMode(), 'IDS', 'Decision engine: should start in IDS mode')

// Test 2: Allow mode changes
assert.strictEqual(engine.setMode('IPS'), true, 'Decision engine: should allow mode change to IPS')
assert.strictEqual(engine.getMode(), 'IPS')
assert.strictEqual(engine.setMode('MONITOR'), true, 'Decision engine: should allow mode change to MONITOR')
assert.strictEqual(engine.getMode(), 'MONITOR')

// Test 3: Reject invalid mode
assert.strictEqual(engine.setMode('INVALID'), false, 'Decision engine: should reject invalid mode')
assert.strictEqual(engine.getMode(), 'MONITOR')

// Test 4: Always BLOCK for blocked sources
engine.setMode('IDS')
const decision1 = engine.decide(10, { active: true })
assert.strictEqual(decision1.action, 'BLOCK', 'Decision engine: should always BLOCK blocked sources')

// Test 5: LOG in MONITOR mode
engine.setMode('MONITOR')
const decision2 = engine.decide(50, null)
assert.strictEqual(decision2.action, 'LOG', 'Decision engine: should LOG in MONITOR mode')

// Test 6: ALERT in IDS mode for high risk
engine.setMode('IDS')
const decision3 = engine.decide(50, null)
assert.strictEqual(decision3.action, 'ALERT', 'Decision engine: should ALERT in IDS mode for high risk')

// Test 7: LOG in IDS mode for low risk
const decision4 = engine.decide(10, null)
assert.strictEqual(decision4.action, 'LOG', 'Decision engine: should LOG in IDS mode for low risk')

// Test 8: BLOCK in IPS mode for critical risk
engine.setMode('IPS')
const decision5 = engine.decide(85, null)
assert.strictEqual(decision5.action, 'BLOCK', 'Decision engine: should BLOCK in IPS mode for critical risk')

// Test 9: TEMP_BLOCK in IPS mode for high risk
const decision6 = engine.decide(50, null)
assert.strictEqual(decision6.action, 'TEMP_BLOCK', 'Decision engine: should TEMP_BLOCK in IPS mode for high risk')

// Test 10: RATE_LIMIT in IPS mode for medium risk
const decision7 = engine.decide(30, null)
assert.strictEqual(decision7.action, 'RATE_LIMIT', 'Decision engine: should RATE_LIMIT in IPS mode for medium risk')

// Test 11: ALLOW in IPS mode for low risk
const decision8 = engine.decide(10, null)
assert.strictEqual(decision8.action, 'ALLOW', 'Decision engine: should ALLOW in IPS mode for low risk')

console.log('✓ All decision engine tests passed!')

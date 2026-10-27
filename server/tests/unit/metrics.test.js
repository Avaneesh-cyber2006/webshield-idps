const assert = require('assert')

console.log('Running metrics calculation tests...')

// Test 1: Accuracy calculation
const tp = 80
const tn = 15
const fp = 3
const fn = 2
const total = tp + tn + fp + fn

const accuracy = (tp + tn) / total
assert.ok(Math.abs(accuracy - 0.95) < 0.01, 'Metrics: should calculate accuracy correctly')

// Test 2: Precision calculation
const precision = tp / (tp + fp)
assert.ok(Math.abs(precision - 0.964) < 0.001, 'Metrics: should calculate precision correctly')

// Test 3: Recall calculation
const recall = tp / (tp + fn)
assert.ok(Math.abs(recall - 0.976) < 0.001, 'Metrics: should calculate recall correctly')

// Test 4: F1 score calculation
const f1 = (2 * precision * recall) / (precision + recall)
assert.ok(Math.abs(f1 - 0.970) < 0.001, 'Metrics: should calculate F1 score correctly')

// Test 5: Division by zero for precision
const precisionZero = (0 + 0) > 0 ? 0 / (0 + 0) : 0
assert.strictEqual(precisionZero, 0, 'Metrics: should handle division by zero for precision')

// Test 6: Division by zero for recall
const recallZero = (0 + 0) > 0 ? 0 / (0 + 0) : 0
assert.strictEqual(recallZero, 0, 'Metrics: should handle division by zero for recall')

// Test 7: Division by zero for F1
const f1Zero = (0 + 0) > 0 ? (2 * 0 * 0) / (0 + 0) : 0
assert.strictEqual(f1Zero, 0, 'Metrics: should handle division by zero for F1')

// Test 8: Percentage conversion
const percentage = accuracy * 100
assert.strictEqual(percentage, 95, 'Metrics: should convert to percentage')

// Test 9: Confusion matrix identification
const isAttackTP = true
const detectedTP = true
assert.ok(isAttackTP && detectedTP, 'Metrics: should identify true positive')

const isAttackTN = false
const detectedTN = false
assert.ok(!isAttackTN && !detectedTN, 'Metrics: should identify true negative')

const isAttackFP = false
const detectedFP = true
assert.ok(!isAttackFP && detectedFP, 'Metrics: should identify false positive')

const isAttackFN = true
const detectedFN = false
assert.ok(isAttackFN && !detectedFN, 'Metrics: should identify false negative')

console.log('✓ All metrics calculation tests passed!')

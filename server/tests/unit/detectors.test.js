const assert = require('assert')
const SQLInjectionDetector = require('../../src/idps/detectors/sqlInjection')
const XSSDetector = require('../../src/idps/detectors/xss')
const PathTraversalDetector = require('../../src/idps/detectors/pathTraversal')

console.log('Running detector tests...')

// SQL Injection Detector tests
const sqlDetector = new SQLInjectionDetector()

const sqlResult1 = sqlDetector.detect({
  query: { id: "' OR '1'='1" },
  body: null,
  path: '/api/search'
})
assert.strictEqual(sqlResult1.matched, true, 'SQL Injection: should detect OR 1=1 pattern')
assert.strictEqual(sqlResult1.category, 'SQL_INJECTION')
assert.strictEqual(sqlResult1.severity, 'HIGH')
assert.strictEqual(sqlResult1.score, 40)

const sqlResult2 = sqlDetector.detect({
  query: { id: '1 UNION SELECT * FROM users' },
  body: null,
  path: '/api/search'
})
assert.strictEqual(sqlResult2.matched, true, 'SQL Injection: should detect UNION SELECT pattern')

const sqlResult3 = sqlDetector.detect({
  query: { id: 'normal search query' },
  body: null,
  path: '/api/search'
})
assert.strictEqual(sqlResult3.matched, false, 'SQL Injection: should not detect normal input')

console.log('✓ SQL Injection Detector tests passed')

// XSS Detector tests
const xssDetector = new XSSDetector()

const xssResult1 = xssDetector.detect({
  query: { query: '<script>alert(1)</script>' },
  body: null,
  path: '/api/search'
})
assert.strictEqual(xssResult1.matched, true, 'XSS: should detect script tag pattern')
assert.strictEqual(xssResult1.category, 'XSS')
assert.strictEqual(xssResult1.severity, 'HIGH')
assert.strictEqual(xssResult1.score, 35)

const xssResult2 = xssDetector.detect({
  query: { url: 'javascript:alert(1)' },
  body: null,
  path: '/api/search'
})
assert.strictEqual(xssResult2.matched, true, 'XSS: should detect javascript: pattern')

const xssResult3 = xssDetector.detect({
  query: { query: 'normal search' },
  body: null,
  path: '/api/search'
})
assert.strictEqual(xssResult3.matched, false, 'XSS: should not detect normal input')

console.log('✓ XSS Detector tests passed')

// Path Traversal Detector tests
const pathDetector = new PathTraversalDetector()

const pathResult1 = pathDetector.detect({
  query: { file: '../../../etc/passwd' },
  body: null,
  path: '/api/files'
})
assert.strictEqual(pathResult1.matched, true, 'Path Traversal: should detect ../ pattern')
assert.strictEqual(pathResult1.category, 'PATH_TRAVERSAL')
assert.strictEqual(pathResult1.severity, 'HIGH')
assert.strictEqual(pathResult1.score, 30)

const pathResult2 = pathDetector.detect({
  query: { file: 'document.pdf' },
  body: null,
  path: '/api/files'
})
assert.strictEqual(pathResult2.matched, false, 'Path Traversal: should not detect normal input')

console.log('✓ Path Traversal Detector tests passed')

console.log('All detector tests passed!')

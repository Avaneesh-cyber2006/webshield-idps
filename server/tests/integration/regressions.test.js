require('../setup-test-db');
const assert = require('assert/strict');
const request = require('supertest');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');
const { getInspector } = require('../../src/middleware/idps');
const { generateToken } = require('../../src/middleware/auth');

async function main() {
  await initializeIDPS();
  const inspector = getInspector();
  const admin = await prisma.user.findUnique({ where: { email: 'admin@webshield.local' } });
  const token = generateToken(admin);
  const adminRequest = (method, path) => request(app)[method](path).set('Authorization', 'Bearer ' + token).set('User-Agent', 'Mozilla/5.0');
  for (const route of ['overview', 'traffic', 'security-events', 'traffic-events', 'blocked-sources', 'security-rules', 'analytics', 'settings', 'device-labels', 'client-ip']) {
    assert.equal((await adminRequest('get', '/api/admin/' + route)).status, 200, route);
  }
  assert.equal((await request(app).get('/api/admin/overview')).status, 401);
  const user = await prisma.user.findUnique({ where: { email: 'user@webshield.local' } });
  assert.equal((await request(app).get('/api/admin/overview').set('Authorization', 'Bearer ' + generateToken(user))).status, 403);
  assert.equal((await request(app).post('/api/auth/login').send({ email: {}, password: [] })).status, 400);
  assert.equal((await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{')).status, 400);
  assert.equal((await request(app).get('/api/does-not-exist')).status, 404);
  const uncached = await request(app).get('/api/demo/search?query=hello').set('User-Agent', 'Mozilla/5.0').set('If-None-Match', '*');
  assert.equal(uncached.status, 200, 'Probe responses must not become cached 304 observations');
  assert.equal(uncached.headers['cache-control'], 'no-store');
  assert.equal(uncached.headers.etag, undefined);
  assert.equal((await adminRequest('get', '/api/admin/traffic?limit=oops')).status, 400);
  assert.equal((await adminRequest('post', '/api/admin/block-source').send({ sourceIp: 'bad-ip', reason: 'test' })).status, 400);
  assert.equal((await adminRequest('post', '/api/admin/device-label').send({ sourceIp: '192.0.2.1', label: 'Regression device' })).status, 200);
  assert.equal((await adminRequest('get', '/api/admin/device-labels')).body.labels[0].label, 'Regression device');
  const ip = '192.0.2.10';
  await inspector.prevention.blockSource(ip, 'first');
  await inspector.prevention.unblockSource(ip);
  await inspector.prevention.blockSource(ip, 'second');
  assert.equal((await inspector.prevention.checkBlocked(ip)).reason, 'second');
  await prisma.blockedSource.update({ where: { sourceIp: ip }, data: { expiresAt: new Date(0) } });
  assert.equal(await inspector.prevention.checkBlocked(ip), null);
  await inspector.prevention.blockSource(ip, 'after expiry');
  assert.ok(await inspector.prevention.checkBlocked(ip));

  const rule = await prisma.securityRule.findUnique({ where: { name: 'XSS Detection' } });
  await adminRequest('put', '/api/admin/security-rules/' + rule.id).send({ enabled: false });
  await initializeIDPS();
  assert.ok(inspector.detectors.disabledDetectors.has('xss'));
  await adminRequest('put', '/api/admin/security-rules/' + rule.id).send({ enabled: true });
  const xss = inspector.detectors.getDetector('xss');
  for (let i = 0; i < 3; i++) assert.equal(xss.detect({ query: '&#123;' }).matched, true);
  const redacted = JSON.stringify(inspector.redact({ nested: { password: 'some secret with spaces', token: 'abc' } }));
  assert.ok(!redacted.includes('some secret') && !redacted.includes('abc'));

  inspector.setMode('IPS');
  await inspector.prevention.blockSource('127.0.0.1', 'local test');
  const blocked = await request(app).get('/api/demo/public').set('User-Agent', 'Mozilla/5.0');
  assert.equal(blocked.status, 403);
  for (let i = 0; i < 50; i++) {
    const event = await prisma.trafficEvent.findFirst({ where: { requestId: blocked.headers['x-request-id'] } });
    if (event) { assert.equal(event.action, 'BLOCK'); assert.equal(event.riskScore, 100); break; }
    if (i === 49) assert.fail('Traffic event never persisted');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal((await adminRequest('delete', '/api/admin/block-source/127.0.0.1')).status, 200);
  assert.equal((await request(app).get('/api/demo/public').set('User-Agent', 'Mozilla/5.0')).status, 200);
  inspector.setMode('IDS');
  const run = (await adminRequest('post', '/api/test-lab/create-run').send({})).body.testRun;
  assert.equal((await request(app).get('/api/admin/overview').set('Authorization', 'Bearer ' + run.token)).status, 401, 'Run proof is not a session token');
  const report = await adminRequest('post', '/api/test-lab/submit').send({ testRunId: run.id, results: [{ testId: 'normal_request', requestId: null, httpStatus: 0, error: 'Network unavailable' }] });
  assert.equal(report.status, 200);
  assert.equal(report.body.testRun.results.length, 1);
  assert.equal(report.body.testRun.metrics.failed, 1);
  assert.equal(report.body.testRun.metrics.executionErrors, 1);
  assert.equal(report.body.testRun.totalTests, 1);
  console.log('PASS: API, authorization, validation, persistence, redaction, block recovery, rule reload, and report regressions');
}
main().then(async () => { await new Promise(resolve => setTimeout(resolve, 100)); await prisma.$disconnect(); }).catch(async error => { console.error(error); await prisma.$disconnect(); process.exit(1); });

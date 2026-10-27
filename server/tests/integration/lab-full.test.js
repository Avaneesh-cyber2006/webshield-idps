require('../setup-test-db');
const assert = require('assert/strict');
const request = require('supertest');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');
const { generateToken } = require('../../src/middleware/auth');

async function main() {
  await initializeIDPS();
  const admin = await prisma.user.findUnique({ where: { email: 'admin@webshield.local' } });
  const token = generateToken(admin);
  const control = (method, path) => request(app)[method]('/api/' + path).set('Authorization', 'Bearer ' + token);
  for (const mode of ['IDS', 'IPS']) {
    assert.equal((await control('post', 'admin/mode').send({ mode })).status, 200);
    const run = (await control('post', 'test-lab/create-run').send({})).body.testRun;
    assert.equal((await control('post', 'test-lab/start/' + run.id)).status, 200);
    const configs = (await control('get', 'test-lab/config')).body.configs;
    const results = [];
    for (const config of configs) {
      assert.equal((await control('post', 'test-lab/cleanup-block/' + run.id).send({ testId: config.testId })).status, 200);
      const payload = config.testId === 'normal_login' ? { email: 'user@webshield.local', password: 'user123' } : config.payload;
      for (let i = 0; i < config.repeatCount; i++) {
        let probe = request(app)[config.method.toLowerCase()](config.endpoint)
          .set('User-Agent', config.testId === 'suspicious_user_agent' ? '' : 'Mozilla/5.0')
          .set('X-Test-Run-ID', run.id).set('X-Test-Run-Token', run.token);
        if (!config.endpoint.includes('/auth/login')) probe = probe.set('Authorization', 'Bearer ' + token);
        if (payload) probe = config.method === 'GET' ? probe.query(payload) : probe.send(payload);
        const response = await probe;
        results.push({ testId: config.testId, requestId: response.headers['x-request-id'], httpStatus: response.status });
      }
    }
    const response = await control('post', 'test-lab/submit').send({ testRunId: run.id, results });
    assert.equal(response.status, 200);
    const report = response.body.testRun;
    assert.equal(report.results.length, 65);
    assert.deepEqual(report.results.filter(result => !result.passed).map(result => ({ id: result.testId, action: result.actualAction, evidence: result.evidence })), [], mode + ' full lab probes');
    assert.equal(report.metrics.passed, 65);
    assert.equal((await control('post', 'test-lab/cleanup/' + run.id)).status, 200);
    console.log('PASS: full ' + mode + ' lab, all 65 real HTTP observations');
  }
  await prisma.$disconnect();
}
main().catch(async error => { console.error(error); await prisma.$disconnect(); process.exit(1); });

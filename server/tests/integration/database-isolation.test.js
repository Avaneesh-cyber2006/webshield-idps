const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const db = path.resolve(__dirname, '../../prisma', (process.env.DATABASE_URL || 'file:./dev.db').slice(5));
const hash = () => fs.existsSync(db) ? crypto.createHash('sha256').update(fs.readFileSync(db)).digest('hex') : null;
const before = hash();
const tests = ['api', 'idps', 'ip-spoofing', 'auth-abuse', 'block-ownership', 'rate-limit', 'sequential-ips-tests', 'testlab-e2e', 'regressions', 'lab-full', 'socket'];
for (const test of tests) {
  execFileSync(process.execPath, [path.join(__dirname, test + '.test.js')], { stdio: 'inherit', env: process.env });
}
require('assert').strictEqual(hash(), before, 'Application database must remain unchanged');
console.log('PASS: all integration tests; application database unchanged');

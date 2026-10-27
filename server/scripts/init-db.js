const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('file:')) throw new Error('Set DATABASE_URL to a SQLite file URL');
const dbPath = path.resolve(__dirname, '../prisma', url.slice(5));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.closeSync(fs.openSync(dbPath, 'a'));
execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
  cwd: path.join(__dirname, '..'), env: process.env, stdio: 'inherit'
});

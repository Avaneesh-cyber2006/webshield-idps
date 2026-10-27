const { execFileSync } = require('child_process');
const path = require('path');
for (const file of ['unit/detectors', 'unit/riskScoring', 'unit/decisionEngine', 'unit/metrics', 'integration/database-isolation']) {
  execFileSync(process.execPath, [path.join(__dirname, file + '.test.js')], { stdio: 'inherit', env: process.env });
}

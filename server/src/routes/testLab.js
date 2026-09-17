const express = require('express');
const router = express.Router();
const { getTests, getTestRuns, getTestRun, getTestConfig, submitBatchTestResults, cleanupTestRun } = require('../controllers/testLab');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/tests', authenticate, requireAdmin, getTests);
// Legacy server-side test execution disabled - use browser-originated testing
// router.post('/run/:testId', authenticate, requireAdmin, runTest);
// router.post('/run-all', authenticate, requireAdmin, runAllTests);
router.get('/runs', authenticate, requireAdmin, getTestRuns);
router.get('/runs/:id', authenticate, requireAdmin, getTestRun);
router.get('/config', authenticate, requireAdmin, getTestConfig);
router.post('/submit', authenticate, requireAdmin, submitBatchTestResults);
router.post('/cleanup/:testRunId', authenticate, requireAdmin, cleanupTestRun);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getOverview,
  getTraffic,
  getSecurityEvents,
  getBlockedSources,
  blockSource,
  unblockSource,
  getSecurityRules,
  updateSecurityRule,
  getAnalytics,
  setMode,
  getSettings,
  updateDeviceLabel,
  getDeviceLabels,
  getTrafficEvents,
  getClientIp
} = require('../controllers/admin');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/overview', authenticate, requireAdmin, getOverview);
router.get('/traffic', authenticate, requireAdmin, getTraffic);
router.get('/security-events', authenticate, requireAdmin, getSecurityEvents);
router.get('/traffic-events', authenticate, requireAdmin, getTrafficEvents);
router.get('/blocked-sources', authenticate, requireAdmin, getBlockedSources);
router.post('/block-source', authenticate, requireAdmin, blockSource);
router.delete('/block-source/:sourceIp', authenticate, requireAdmin, unblockSource);
router.get('/security-rules', authenticate, requireAdmin, getSecurityRules);
router.put('/security-rules/:id', authenticate, requireAdmin, updateSecurityRule);
router.get('/analytics', authenticate, requireAdmin, getAnalytics);
router.post('/mode', authenticate, requireAdmin, setMode);
router.get('/settings', authenticate, requireAdmin, getSettings);
router.post('/device-label', authenticate, requireAdmin, updateDeviceLabel);
router.get('/device-labels', authenticate, requireAdmin, getDeviceLabels);
router.get('/client-ip', authenticate, getClientIp);

module.exports = router;

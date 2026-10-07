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
const { validate, schemas } = require('../middleware/validation');
router.use(authenticate, requireAdmin);
router.use((req, res, next) => req.method === 'GET' ? validate(schemas.filters, 'query')(req, res, next) : next());

router.get('/overview', authenticate, requireAdmin, getOverview);
router.get('/traffic', authenticate, requireAdmin, getTraffic);
router.get('/security-events', authenticate, requireAdmin, getSecurityEvents);
router.get('/traffic-events', authenticate, requireAdmin, getTrafficEvents);
router.get('/blocked-sources', authenticate, requireAdmin, getBlockedSources);
router.post('/block-source', validate(schemas.block), blockSource);
router.delete('/block-source/:sourceIp', authenticate, requireAdmin, unblockSource);
router.get('/security-rules', authenticate, requireAdmin, getSecurityRules);
router.put('/security-rules/:id', validate(schemas.rule), updateSecurityRule);
router.get('/analytics', authenticate, requireAdmin, getAnalytics);
router.post('/mode', validate(schemas.mode), setMode);
router.get('/settings', authenticate, requireAdmin, getSettings);
router.post('/device-label', validate(schemas.label), updateDeviceLabel);
router.get('/device-labels', authenticate, requireAdmin, getDeviceLabels);
router.get('/client-ip', authenticate, getClientIp);

module.exports = router;

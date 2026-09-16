const prisma = require('../config/database');
const { getInspector } = require('../middleware/idps');

/**
 * Get overview statistics
 */
async function getOverview(req, res) {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      totalRequests,
      threatsDetected,
      requestsBlocked,
      activeBlocks,
      criticalThreats
    ] = await Promise.all([
      prisma.trafficEvent.count(),
      prisma.securityEvent.count({
        where: { riskScore: { gt: 0 } }
      }),
      prisma.securityEvent.count({
        where: { blocked: true }
      }),
      prisma.blockedSource.count({
        where: { active: true }
      }),
      prisma.securityEvent.count({
        where: {
          severity: 'CRITICAL',
          createdAt: { gte: oneHourAgo }
        }
      })
    ]);

    // Calculate detection rate
    const detectionRate = totalRequests > 0
      ? Math.round((threatsDetected / totalRequests) * 100)
      : 0;

    const inspector = getInspector();
    const currentMode = inspector ? inspector.getMode() : 'IDS';

    res.json({
      success: true,
      data: {
        totalRequests,
        threatsDetected,
        requestsBlocked,
        activeBlocks,
        criticalThreats,
        detectionRate,
        currentMode
      }
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load overview'
    });
  }
}

/**
 * Get recent traffic events
 */
async function getTraffic(req, res) {
  try {
    const { limit = 50, method, source, blocked } = req.query;

    const where = {};
    if (method) where.method = method;
    if (source) where.sourceIp = source;
    if (blocked !== undefined) where.action = blocked === 'true' ? 'BLOCK' : { not: 'BLOCK' };

    const events = await prisma.trafficEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load traffic'
    });
  }
}

/**
 * Get security events
 */
async function getSecurityEvents(req, res) {
  try {
    const { limit = 50, severity, category, source, date } = req.query;

    const where = {};
    if (severity) where.severity = severity;
    if (category) where.attackType = { contains: category };
    if (source) where.sourceIp = source;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { gte: startDate, lt: endDate };
    }

    const events = await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load security events'
    });
  }
}

/**
 * Get blocked sources
 */
async function getBlockedSources(req, res) {
  try {
    const blockedSources = await prisma.blockedSource.findMany({
      orderBy: { blockedAt: 'desc' },
      include: {
        _count: true
      }
    });

    // Add device labels if available
    const deviceLabels = await prisma.deviceLabel.findMany();
    const labelMap = new Map(deviceLabels.map(l => [l.sourceIp, l.label]));

    const sourcesWithLabels = blockedSources.map(source => ({
      ...source,
      deviceLabel: labelMap.get(source.sourceIp) || null
    }));

    res.json({
      success: true,
      sources: sourcesWithLabels
    });
  } catch (error) {
    console.error('Blocked sources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load blocked sources'
    });
  }
}

/**
 * Block a source
 */
async function blockSource(req, res) {
  try {
    const { sourceIp, reason, isTemporary, duration } = req.body;

    if (!sourceIp || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Source IP and reason are required'
      });
    }

    const inspector = getInspector();
    if (inspector) {
      const durationMs = duration ? parseInt(duration) * 1000 : 300000;
      await inspector.prevention.blockSource(sourceIp, reason, isTemporary, durationMs);
    }

    res.json({
      success: true,
      message: 'Source blocked successfully'
    });
  } catch (error) {
    console.error('Block source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block source'
    });
  }
}

/**
 * Unblock a source
 */
async function unblockSource(req, res) {
  try {
    const { sourceIp } = req.params;

    const inspector = getInspector();
    if (inspector) {
      await inspector.prevention.unblockSource(sourceIp);
    }

    res.json({
      success: true,
      message: 'Source unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock source'
    });
  }
}

/**
 * Get security rules
 */
async function getSecurityRules(req, res) {
  try {
    const rules = await prisma.securityRule.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Security rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load security rules'
    });
  }
}

/**
 * Update security rule
 */
async function updateSecurityRule(req, res) {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const rule = await prisma.securityRule.findUnique({
      where: { id }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }

    await prisma.securityRule.update({
      where: { id },
      data: { enabled }
    });

    // Update detector registry
    const { getInspector } = require('../middleware/idps');
    const inspector = getInspector();
    if (inspector) {
      const registry = inspector.detectors;
      if (registry && registry.setDetectorEnabled) {
        registry.setDetectorEnabled(rule.name, enabled);
      }
    }

    res.json({
      success: true,
      message: 'Rule updated successfully'
    });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rule'
    });
  }
}

/**
 * Get analytics data
 */
async function getAnalytics(req, res) {
  try {
    const { timeframe = '24h' } = req.query;

    const now = new Date();
    let startDate;

    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const threats = await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        riskScore: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by time
    const threatsByTime = threats.reduce((acc, threat) => {
      const hour = new Date(threat.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Group by category
    const threatsByCategory = threats.reduce((acc, threat) => {
      const category = threat.attackType || 'UNKNOWN';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Group by severity
    const threatsBySeverity = threats.reduce((acc, threat) => {
      const severity = threat.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    // Allowed vs blocked
    const allowed = await prisma.trafficEvent.count({
      where: {
        createdAt: { gte: startDate },
        action: 'ALLOW'
      }
    });

    const blocked = await prisma.trafficEvent.count({
      where: {
        createdAt: { gte: startDate },
        action: { in: ['BLOCK', 'TEMP_BLOCK', 'RATE_LIMIT'] }
      }
    });

    res.json({
      success: true,
      data: {
        threatsByTime,
        threatsByCategory,
        threatsBySeverity,
        allowed,
        blocked
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load analytics'
    });
  }
}

/**
 * Set IDPS mode
 */
async function setMode(req, res) {
  try {
    const { mode } = req.body;

    const inspector = getInspector();
    if (inspector) {
      const success = inspector.setMode(mode);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mode'
        });
      }
    }

    // Save to database
    await prisma.systemSetting.upsert({
      where: { key: 'idps_mode' },
      update: { value: mode },
      create: { key: 'idps_mode', value: mode }
    });

    res.json({
      success: true,
      message: 'Mode updated successfully',
      mode
    });
  } catch (error) {
    console.error('Set mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set mode'
    });
  }
}

/**
 * Get system settings
 */
async function getSettings(req, res) {
  try {
    const settings = await prisma.systemSetting.findMany();

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      settings: settingsMap
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load settings'
    });
  }
}

/**
 * Update device label
 */
async function updateDeviceLabel(req, res) {
  try {
    const { sourceIp, label } = req.body;

    if (!sourceIp || !label) {
      return res.status(400).json({
        success: false,
        message: 'Source IP and label are required'
      });
    }

    await prisma.deviceLabel.upsert({
      where: { sourceIp },
      update: { label },
      create: { sourceIp, label }
    });

    res.json({
      success: true,
      message: 'Device label updated successfully'
    });
  } catch (error) {
    console.error('Update device label error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device label'
    });
  }
}

/**
 * Get device labels
 */
async function getDeviceLabels(req, res) {
  try {
    const labels = await prisma.deviceLabel.findMany();

    res.json({
      success: true,
      labels
    });
  } catch (error) {
    console.error('Get device labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load device labels'
    });
  }
}

/**
 * Get traffic events for system logs
 */
async function getTrafficEvents(req, res) {
  try {
    const { limit = 50 } = req.query;
    const events = await prisma.trafficEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Get traffic events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load traffic events'
    });
  }
}

/**
 * Get client IP for network demo
 */
async function getClientIp(req, res) {
  try {
    const { getClientIp } = require('../utils/ip');
    const clientIp = getClientIp(req);

    res.json({
      success: true,
      clientIp,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get client IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client IP'
    });
  }
}

module.exports = {
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
};

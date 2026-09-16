module.exports = {
  // Detection thresholds
  thresholds: {
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000 // 1 minute
    },
    loginFailure: {
      maxAttempts: 5,
      windowMs: 60000 // 1 minute
    },
    maxPayloadSize: 1048576, // 1MB
    tempBlockDuration: 300000 // 5 minutes
  },

  // Risk score thresholds
  riskLevels: {
    LOW: { min: 0, max: 19 },
    MEDIUM: { min: 20, max: 39 },
    HIGH: { min: 40, max: 69 },
    CRITICAL: { min: 70, max: 100 }
  },

  // Detection scores
  detectionScores: {
    suspiciousUserAgent: 10,
    authenticationFailure: 10,
    requestRateAbuse: 20,
    pathTraversal: 30,
    xssPattern: 35,
    sqlInjectionPattern: 40,
    payloadSizeExceeded: 15
  },

  // System modes
  modes: {
    MONITOR: 'MONITOR',
    IDS: 'IDS',
    IPS: 'IPS'
  },

  // Security actions
  actions: {
    ALLOW: 'ALLOW',
    LOG: 'LOG',
    ALERT: 'ALERT',
    RATE_LIMIT: 'RATE_LIMIT',
    TEMP_BLOCK: 'TEMP_BLOCK',
    BLOCK: 'BLOCK'
  },

  // Severity levels
  severities: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
};

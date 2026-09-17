const { v4: uuidv4 } = require('uuid');
const DetectorRegistry = require('../detectors');
const RiskScoringEngine = require('../scoring/engine');
const DecisionEngine = require('../prevention/decision');
const PreventionLayer = require('../prevention/blocker');
const { getClientIp } = require('../../utils/ip');
const prisma = require('../../config/database');

/**
 * IDPS Request Inspector
 * Main IDPS middleware that inspects, detects, scores, and prevents
 */
class IDPSInspector {
  constructor(io) {
    this.detectors = new DetectorRegistry();
    this.riskEngine = new RiskScoringEngine();
    this.decisionEngine = new DecisionEngine();
    this.prevention = new PreventionLayer();
    this.io = io;

    // Load disabled detectors from database
    this.detectors.loadDisabledDetectors();
  }

  setMode(mode) {
    return this.decisionEngine.setMode(mode);
  }

  getMode() {
    return this.decisionEngine.getMode();
  }

  async inspect(req, res, next) {
    const requestId = `REQ-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const sourceIp = getClientIp(req);
    const runId = req.headers['x-test-run-id'] || null; // Associate with TestRun if provided

    // Validate runId if provided (must correspond to an existing TestRun)
    let validatedRunId = null;
    if (runId) {
      try {
        const testRun = await prisma.testRun.findUnique({
          where: { id: runId }
        });
        if (testRun && (testRun.status === 'CREATED' || testRun.status === 'RUNNING')) {
          validatedRunId = runId;
        }
      } catch (error) {
        // Invalid runId, treat as null
        console.warn(`Invalid runId provided: ${runId}`);
      }
    }

    // Store request ID for later use
    req.idps = {
      requestId,
      sourceIp,
      runId: validatedRunId,
      startTime: Date.now()
    };

    // Add request ID to response headers IMMEDIATELY for correlation
    res.setHeader('X-Request-ID', requestId);

    // Register response-finish listener BEFORE any possible early return
    res.on('finish', async () => {
      try {
        // Post-response: handle auth failure detection
        const isAuthFailure = res.statusCode === 401 && (req.originalUrl || req.path).includes('/api/auth');

        if (isAuthFailure) {
          // Run auth abuse detector with failure flag
          const authDetectionData = {
            sourceIp,
            method: req.method,
            path: req.originalUrl || req.path,
            query: req.query,
            body: req.body,
            headers: req.headers,
            userAgent: req.headers['user-agent'],
            isAuthFailure: true
          };
          const authResults = this.detectors.runAll(authDetectionData);
          const authRiskResult = this.riskEngine.calculate(authResults);

          if (authRiskResult.score > 0) {
            await this.logSecurityEvent(req, {
              attackType: authRiskResult.categories.join(', ') || 'AUTH_FAILURE',
              severity: authRiskResult.severity,
              riskScore: authRiskResult.score,
              action: 'ALERT',
              description: 'Authentication failure detected',
              blocked: false
            });
          }
        }

        // Log traffic event
        await this.logTrafficEvent(req, res);
      } catch (error) {
        console.error('Error in response-finish handler:', error);
      }
    });

    // Check if source is blocked
    // Allow cleanup and submit requests to pass through even if blocked (for admin self-unblock and report submission)
    const isAllowedRequest = req.path && (req.path.includes('/cleanup/') || req.path.includes('/submit'));
    const blockedSource = await this.prevention.checkBlocked(sourceIp);
    if (blockedSource && !isAllowedRequest) {
      await this.logSecurityEvent(req, {
        attackType: 'BLOCKED_SOURCE',
        severity: 'CRITICAL',
        riskScore: 100,
        action: 'BLOCK',
        description: 'Request from blocked source',
        blocked: true
      });

      return res.status(403).json({
        success: false,
        message: 'Request blocked by WebShield IDPS',
        requestId,
        riskScore: 100
      });
    }

    // Prepare detection data for pre-response detection
    const detectionData = {
      sourceIp,
      method: req.method,
      path: req.originalUrl || req.path,
      query: req.query,
      body: req.body,
      headers: req.headers,
      userAgent: req.headers['user-agent'],
      isAuthFailure: req.authFailure || false
    };

    // Run all detectors
    const detectionResults = this.detectors.runAll(detectionData);

    // Calculate risk score
    const riskResult = this.riskEngine.calculate(detectionResults);

    // Store risk result in request
    req.idps.riskScore = riskResult.score;
    req.idps.severity = riskResult.severity;
    req.idps.categories = riskResult.categories;
    req.idps.detectionResults = detectionResults;

    // Make decision
    const decision = this.decisionEngine.decide(riskResult.score, blockedSource);

    // Store decision in request
    req.idps.action = decision.action;

    // Handle prevention based on decision
    if (decision.action === 'BLOCK') {
      await this.prevention.blockSource(sourceIp, decision.reason, false, 0, req.idps.runId);
      await this.logSecurityEvent(req, {
        attackType: riskResult.categories.join(', ') || 'MULTIPLE_INDICATORS',
        severity: riskResult.severity,
        riskScore: riskResult.score,
        action: decision.action,
        description: decision.reason,
        blocked: true
      });

      return res.status(403).json({
        success: false,
        message: 'Request blocked by WebShield IDPS',
        requestId,
        riskScore: riskResult.score
      });
    }

    if (decision.action === 'TEMP_BLOCK') {
      await this.prevention.blockSource(sourceIp, decision.reason, true, 300000, req.idps.runId);
      await this.logSecurityEvent(req, {
        attackType: riskResult.categories.join(', ') || 'MULTIPLE_INDICATORS',
        severity: riskResult.severity,
        riskScore: riskResult.score,
        action: decision.action,
        description: decision.reason,
        blocked: true
      });

      return res.status(403).json({
        success: false,
        message: 'Request blocked by WebShield IDPS',
        requestId,
        riskScore: riskResult.score
      });
    }

    if (decision.action === 'RATE_LIMIT') {
      const rateLimitResult = this.prevention.checkRateLimit(sourceIp);
      if (!rateLimitResult.allowed) {
        await this.logSecurityEvent(req, {
          attackType: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          riskScore: riskResult.score,
          action: decision.action,
          description: decision.reason,
          blocked: true
        });

        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          requestId,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }
    }

    // Log security event for ALERT or LOG actions
    if (decision.action === 'ALERT' || decision.action === 'LOG') {
      if (riskResult.score > 0) {
        await this.logSecurityEvent(req, {
          attackType: riskResult.categories.join(', ') || 'SUSPICIOUS',
          severity: riskResult.severity,
          riskScore: riskResult.score,
          action: decision.action,
          description: decision.reason,
          blocked: false
        });
      }
    }

    // Continue to route handler
    next();
  }

  async logSecurityEvent(req, eventData) {
    try {
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Mask sensitive data
      const maskedUserAgent = this.maskSensitiveData(userAgent);

      const event = await prisma.securityEvent.create({
        data: {
          requestId: req.idps.requestId,
          runId: req.idps.runId,  // Associate with TestRun for safe cleanup
          sourceIp: req.idps.sourceIp,
          method: req.method,
          path: req.path,
          attackType: eventData.attackType,
          severity: eventData.severity,
          riskScore: eventData.riskScore,
          action: eventData.action,
          description: eventData.description,
          userAgent: maskedUserAgent,
          blocked: eventData.blocked
        }
      });

      // Emit socket event to admin room only
      if (this.io) {
        this.io.to('admin').emit('security:new', event);
        this.io.to('admin').emit('metrics:update');
      }

      return event;
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async logTrafficEvent(req, res) {
    try {
      const maskedQuery = this.maskSensitiveData(JSON.stringify(req.query));
      const maskedBody = this.maskSensitiveData(JSON.stringify(req.body));
      const maskedUserAgent = this.maskSensitiveData(req.headers['user-agent'] || 'unknown');

      await prisma.trafficEvent.create({
        data: {
          requestId: req.idps.requestId,
          runId: req.idps.runId,  // Associate with TestRun for safe cleanup
          sourceIp: req.idps.sourceIp,
          method: req.method,
          path: req.path,
          query: maskedQuery.substring(0, 500),
          body: maskedBody.substring(0, 500),
          userAgent: maskedUserAgent.substring(0, 500),
          status: res.statusCode || 200,
          riskScore: req.idps.riskScore || 0,
          action: req.idps.action || 'ALLOW'
        }
      });

      // Emit socket event to admin room only
      if (this.io) {
        this.io.to('admin').emit('traffic:new', {
          requestId: req.idps.requestId,
          sourceIp: req.idps.sourceIp,
          method: req.method,
          path: req.path,
          status: res.statusCode || 200,
          riskScore: req.idps.riskScore || 0,
          action: req.idps.action || 'ALLOW',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error logging traffic event:', error);
    }
  }

  maskSensitiveData(data) {
    if (!data) return '';

    const sensitivePatterns = [
      /password["\s:=]+[^\s"']+/gi,
      /token["\s:=]+[^\s"']+/gi,
      /authorization["\s:=]+[^\s"']+/gi,
      /secret["\s:=]+[^\s"']+/gi,
      /key["\s:=]+[^\s"']+/gi,
      /bearer\s+[^\s]+/gi
    ];

    let masked = data;
    for (const pattern of sensitivePatterns) {
      masked = masked.replace(pattern, '[REDACTED]');
    }

    return masked;
  }
}

module.exports = IDPSInspector;

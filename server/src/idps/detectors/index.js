const SQLInjectionDetector = require('./sqlInjection');
const XSSDetector = require('./xss');
const PathTraversalDetector = require('./pathTraversal');
const LoginAbuseDetector = require('./loginAbuse');
const RequestRateDetector = require('./requestRate');
const SuspiciousUserAgentDetector = require('./suspiciousUserAgent');
const AuthAbuseDetector = require('./authAbuse');
const PayloadSizeDetector = require('./payloadSize');

const prisma = require('../../config/database');

class DetectorRegistry {
  constructor() {
    this.detectors = {
      sqlInjection: new SQLInjectionDetector(),
      xss: new XSSDetector(),
      pathTraversal: new PathTraversalDetector(),
      loginAbuse: new LoginAbuseDetector(),
      requestRate: new RequestRateDetector(),
      suspiciousUserAgent: new SuspiciousUserAgentDetector(),
      authAbuse: new AuthAbuseDetector(),
      payloadSize: new PayloadSizeDetector()
    };

    this.disabledDetectors = new Set();
    this.detectorNameMap = {
      'SQL Injection Detection': 'sqlInjection',
      'XSS Detection': 'xss',
      'Path Traversal Detection': 'pathTraversal',
      'Login Abuse Protection': 'loginAbuse',
      'Request Rate Protection': 'requestRate',
      'Suspicious User-Agent Detection': 'suspiciousUserAgent',
      'Authentication Abuse Detection': 'authAbuse',
      'Payload Size Protection': 'payloadSize'
    };
  }

  async loadDisabledDetectors() {
    try {
      const rules = await prisma.securityRule.findMany({
        where: { enabled: false }
      });

      this.disabledDetectors.clear();
      for (const rule of rules) {
        const detectorName = this.detectorNameMap[rule.name];
        if (detectorName) {
          this.disabledDetectors.add(detectorName);
        }
      }
    } catch (error) {
      console.error('Error loading disabled detectors:', error);
    }
  }

  setDetectorEnabled(ruleName, enabled) {
    const detectorName = this.detectorNameMap[ruleName];
    if (!detectorName) return false;

    if (enabled) {
      this.disabledDetectors.delete(detectorName);
    } else {
      this.disabledDetectors.add(detectorName);
    }
    return true;
  }

  runAll(data) {
    const results = [];

    for (const [name, detector] of Object.entries(this.detectors)) {
      // Skip disabled detectors
      if (this.disabledDetectors.has(name)) {
        continue;
      }

      try {
        const result = detector.detect(data);
        if (result.matched) {
          results.push({
            detector: name,
            ...result
          });
        }
      } catch (error) {
        console.error(`Error in detector ${name}:`, error);
      }
    }

    return results;
  }

  runSpecific(detectorName, data) {
    // Check if detector is disabled
    if (this.disabledDetectors.has(detectorName)) {
      return { matched: false };
    }

    const detector = this.detectors[detectorName];
    if (!detector) {
      return { matched: false };
    }

    try {
      return detector.detect(data);
    } catch (error) {
      console.error(`Error in detector ${detectorName}:`, error);
      return { matched: false };
    }
  }

  clearState(sourceIp) {
    this.detectors.loginAbuse.clear(sourceIp);
    this.detectors.requestRate.clear(sourceIp);
    this.detectors.authAbuse.clear(sourceIp);
  }
}

module.exports = DetectorRegistry;

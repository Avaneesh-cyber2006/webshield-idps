const SQLInjectionDetector = require('./sqlInjection');
const XSSDetector = require('./xss');
const PathTraversalDetector = require('./pathTraversal');
const LoginAbuseDetector = require('./loginAbuse');
const RequestRateDetector = require('./requestRate');
const SuspiciousUserAgentDetector = require('./suspiciousUserAgent');
const AuthAbuseDetector = require('./authAbuse');
const PayloadSizeDetector = require('./payloadSize');

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
  }

  runAll(data) {
    const results = [];

    for (const [name, detector] of Object.entries(this.detectors)) {
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

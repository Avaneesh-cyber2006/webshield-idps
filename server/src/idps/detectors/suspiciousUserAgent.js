/**
 * Suspicious User-Agent Detector
 * Detects missing, empty, or suspicious user-agent headers
 */
class SuspiciousUserAgentDetector {
  constructor() {
    this.suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /java/i,
      /go-http-client/i,
      /test-agent/i,
      /webshield-test/i
    ];
  }

  detect(data) {
    const { userAgent } = data;

    // Check for missing or empty user-agent
    if (!userAgent || userAgent.trim() === '' || userAgent === '-') {
      return {
        matched: true,
        category: 'SUSPICIOUS_USER_AGENT',
        severity: 'LOW',
        score: 10,
        description: 'Missing or empty User-Agent header'
      };
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return {
          matched: true,
          category: 'SUSPICIOUS_USER_AGENT',
          severity: 'LOW',
          score: 10,
          description: 'Suspicious User-Agent pattern detected'
        };
      }
    }

    return { matched: false };
  }
}

module.exports = SuspiciousUserAgentDetector;

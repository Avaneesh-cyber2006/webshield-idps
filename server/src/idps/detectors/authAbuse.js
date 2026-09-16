/**
 * Authentication Abuse Detector
 * Detects repeated authentication failures
 */
class AuthAbuseDetector {
  constructor() {
    this.failureMap = new Map();
  }

  detect(data) {
    const { sourceIp, isAuthFailure } = data;

    // Only track actual failures
    if (!isAuthFailure) {
      return { matched: false };
    }

    const now = Date.now();
    const key = sourceIp;

    if (!this.failureMap.has(key)) {
      this.failureMap.set(key, []);
    }

    const failures = this.failureMap.get(key);

    // Remove failures older than the window (60 seconds)
    const windowMs = 60000;
    const recentFailures = failures.filter(timestamp => now - timestamp < windowMs);
    this.failureMap.set(key, recentFailures);

    // Add current failure
    recentFailures.push(now);

    // Check threshold (3 failures in 60 seconds for auth abuse)
    const threshold = 3;
    if (recentFailures.length >= threshold) {
      return {
        matched: true,
        category: 'AUTH_ABUSE',
        severity: 'MEDIUM',
        score: 10,
        description: `Repeated authentication failures detected (${recentFailures.length} attempts)`
      };
    }

    return { matched: false };
  }

  clear(sourceIp) {
    this.failureMap.delete(sourceIp);
  }
}

module.exports = AuthAbuseDetector;

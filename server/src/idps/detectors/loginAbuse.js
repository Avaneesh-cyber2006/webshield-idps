/**
 * Login Abuse Detector
 * Tracks repeated authentication failures from the same source
 */
class LoginAbuseDetector {
  constructor() {
    this.failureMap = new Map();
  }

  detect(data) {
    const { sourceIp, path, isAuthFailure } = data;

    // Only track authentication-related endpoints
    if (!this.isAuthEndpoint(path)) {
      return { matched: false };
    }

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

    // Check threshold (5 failures in 60 seconds)
    const threshold = 5;
    if (recentFailures.length >= threshold) {
      return {
        matched: true,
        category: 'LOGIN_ABUSE',
        severity: 'MEDIUM',
        score: 10,
        description: `Repeated login failures detected (${recentFailures.length} attempts)`
      };
    }

    return { matched: false };
  }

  isAuthEndpoint(path) {
    const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth'];
    return authEndpoints.some(endpoint => path.includes(endpoint));
  }

  clear(sourceIp) {
    this.failureMap.delete(sourceIp);
  }
}

module.exports = LoginAbuseDetector;

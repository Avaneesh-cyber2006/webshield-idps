/**
 * Request Rate Abuse Detector
 * Tracks request frequency per client
 */
class RequestRateDetector {
  constructor() {
    this.requestMap = new Map();
  }

  detect(data) {
    const { sourceIp } = data;

    const now = Date.now();
    const key = sourceIp;

    if (!this.requestMap.has(key)) {
      this.requestMap.set(key, []);
    }

    const requests = this.requestMap.get(key);

    // Remove requests older than the window (60 seconds)
    const windowMs = 60000;
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.requestMap.set(key, recentRequests);

    // Add current request
    recentRequests.push(now);

    // Check threshold (50 requests in 60 seconds)
    const threshold = 50;
    if (recentRequests.length >= threshold) {
      return {
        matched: true,
        category: 'REQUEST_RATE_ABUSE',
        severity: 'MEDIUM',
        score: 20,
        description: `Excessive request rate detected (${recentRequests.length} requests in 60s)`
      };
    }

    return { matched: false };
  }

  clear(sourceIp) {
    this.requestMap.delete(sourceIp);
  }
}

module.exports = RequestRateDetector;

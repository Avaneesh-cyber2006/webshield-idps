const prisma = require('../../config/database');

/**
 * Prevention Layer
 * Handles blocking, rate limiting, and temporary blocking
 */
class PreventionLayer {
  constructor() {
    this.rateLimitMap = new Map();
  }

  async checkBlocked(sourceIp) {
    try {
      const blocked = await prisma.blockedSource.findFirst({
        where: {
          sourceIp,
          active: true
        }
      });

      if (blocked) {
        // Check if temporary block has expired
        if (blocked.expiresAt && new Date(blocked.expiresAt) < new Date()) {
          await prisma.blockedSource.update({
            where: { id: blocked.id },
            data: { active: false }
          });
          return null;
        }
      }

      return blocked;
    } catch (error) {
      console.error('Error checking blocked source:', error);
      return null;
    }
  }

  async blockSource(sourceIp, reason, isTemporary = false, durationMs = 300000, testRunId = null) {
    try {
      const expiresAt = isTemporary
        ? new Date(Date.now() + durationMs)
        : null;

      await prisma.blockedSource.upsert({
        where: { sourceIp },
        update: {
          reason,
          blockedAt: new Date(),
          expiresAt,
          active: true,
          testRunId: testRunId || null  // Update ownership if provided
        },
        create: {
          sourceIp,
          reason,
          blockedAt: new Date(),
          expiresAt,
          active: true,
          testRunId: testRunId || null  // Track ownership if provided
        }
      });

      return true;
    } catch (error) {
      console.error('Error blocking source:', error);
      return false;
    }
  }

  async unblockSource(sourceIp) {
    try {
      await prisma.blockedSource.updateMany({
        where: { sourceIp },
        data: { active: false }
      });

      return true;
    } catch (error) {
      console.error('Error unblocking source:', error);
      return false;
    }
  }

  checkRateLimit(sourceIp, maxRequests = 50, windowMs = 60000) {
    const now = Date.now();

    if (!this.rateLimitMap.has(sourceIp)) {
      this.rateLimitMap.set(sourceIp, []);
    }

    const requests = this.rateLimitMap.get(sourceIp);

    // Remove requests older than the window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.rateLimitMap.set(sourceIp, recentRequests);

    // Check if rate limit exceeded
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: recentRequests[0] + windowMs
      };
    }

    // Add current request
    recentRequests.push(now);

    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      resetTime: now + windowMs
    };
  }

  clearRateLimit(sourceIp) {
    this.rateLimitMap.delete(sourceIp);
  }
}

module.exports = PreventionLayer;

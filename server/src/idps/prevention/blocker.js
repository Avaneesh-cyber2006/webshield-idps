const prisma = require('../../config/database');

/**
 * Prevention Layer
 * Handles blocking, rate limiting, and temporary blocking
 */
class PreventionLayer {
  constructor() {
    this.rateLimitMap = new Map();
    // Reference to detector's request map for consistent rate limiting
    this.detectorRequestMap = null;
  }

  setDetectorRequestMap(detectorRequestMap) {
    this.detectorRequestMap = detectorRequestMap;
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

      // Check if a block already exists
      const existingBlock = await prisma.blockedSource.findUnique({
        where: { sourceIp }
      });

      if (existingBlock) {
        // If this is a manual block (no testRunId), never overwrite it
        if (!existingBlock.testRunId) {
          console.log(`Manual block exists for ${sourceIp}, not overwriting with test-generated block`);
          return true; // Consider it blocked (preserving manual block)
        }

        // If this block belongs to a different test run, don't overwrite it
        if (existingBlock.testRunId !== testRunId) {
          console.log(`Block for ${sourceIp} belongs to different test run ${existingBlock.testRunId}, not overwriting`);
          return true; // Consider it blocked (preserving other run's block)
        }

        // If this block belongs to the same test run, update it
        await prisma.blockedSource.update({
          where: { sourceIp },
          data: {
            reason,
            blockedAt: new Date(),
            expiresAt,
            active: true
          }
        });
      } else {
        // No existing block, create a new one
        await prisma.blockedSource.create({
          data: {
            sourceIp,
            reason,
            blockedAt: new Date(),
            expiresAt,
            active: true,
            testRunId: testRunId || null  // Track ownership if provided
          }
        });
      }

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

    // Use detector's request map for consistent counting if available
    const requestMap = this.detectorRequestMap || this.rateLimitMap;

    if (!requestMap.has(sourceIp)) {
      requestMap.set(sourceIp, []);
    }

    const requests = requestMap.get(sourceIp);

    // Remove requests older than the window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    requestMap.set(sourceIp, recentRequests);

    // Check if rate limit exceeded (detector already added current request)
    // Do NOT add current request again - detector already did
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: recentRequests[0] + windowMs
      };
    }

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

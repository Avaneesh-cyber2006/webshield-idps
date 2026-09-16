/**
 * Normalize IP address - convert IPv6-mapped IPv4 to IPv4
 * Handles ::ffff:192.168.1.1 -> 192.168.1.1
 */
function normalizeIp(ip) {
  if (!ip) return 'unknown';

  // Handle IPv6-mapped IPv4 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // Handle localhost variations
  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1';
  }

  return ip;
}

/**
 * Get client IP from request, handling various proxy scenarios
 * Only trusts X-Forwarded-For when explicitly configured (not implemented yet)
 */
function getClientIp(req) {
  const trustedProxy = process.env.TRUSTED_PROXY; // Future: set this if using reverse proxy

  const remoteAddr = req.socket.remoteAddress;

  // Only trust forwarded headers if explicitly configured
  if (trustedProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : realIp || remoteAddr;
    return normalizeIp(ip);
  }

  // Default: use direct socket address, ignore forwarded headers
  return normalizeIp(remoteAddr);
}

/**
 * Validate that an IP address is from the local network
 */
function isLocalNetwork(ip) {
  if (!ip || ip === 'unknown') return false;

  // Check for localhost
  if (ip === '127.0.0.1' || ip === '::1') return true;

  // Check for private IP ranges
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0/8
  if (first === 10) return true;

  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;

  return false;
}

module.exports = {
  normalizeIp,
  getClientIp,
  isLocalNetwork
};

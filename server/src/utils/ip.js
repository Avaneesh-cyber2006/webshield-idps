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
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const remoteAddr = req.socket.remoteAddress;

  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || remoteAddr;

  return normalizeIp(ip);
}

module.exports = {
  normalizeIp,
  getClientIp
};

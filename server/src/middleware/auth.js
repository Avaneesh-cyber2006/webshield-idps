const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === 'your-secret-key-here') {
  throw new Error('JWT_SECRET must be a private value of at least 32 characters in server/.env.');
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 */
async function authenticate(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.authFailure = true;
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);

  if (!decoded || typeof decoded.id !== 'string') {
    req.authFailure = true;
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  try {
    const user = await require('../config/database').user.findUnique({ where: { id: decoded.id }, select: { id: true, email: true, role: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    req.user = user;
    next();
  } catch (error) { next(error); }
}

/**
 * Admin-only middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  requireAdmin
};

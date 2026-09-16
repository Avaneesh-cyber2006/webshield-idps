const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateToken } = require('../middleware/auth');

// Simple in-memory rate limiter for auth failures
const authFailureMap = new Map();
const AUTH_FAILURE_THRESHOLD = 10;
const AUTH_FAILURE_WINDOW = 60000; // 1 minute

function checkAuthRateLimit(sourceIp) {
  const now = Date.now();
  const key = sourceIp;

  if (!authFailureMap.has(key)) {
    authFailureMap.set(key, []);
  }

  const failures = authFailureMap.get(key);

  // Remove failures older than the window
  const recentFailures = failures.filter(timestamp => now - timestamp < AUTH_FAILURE_WINDOW);
  authFailureMap.set(key, recentFailures);

  // Check threshold
  if (recentFailures.length >= AUTH_FAILURE_THRESHOLD) {
    return {
      allowed: false,
      resetTime: recentFailures[0] + AUTH_FAILURE_WINDOW
    };
  }

  return { allowed: true };
}

function recordAuthFailure(sourceIp) {
  const key = sourceIp;
  if (!authFailureMap.has(key)) {
    authFailureMap.set(key, []);
  }
  authFailureMap.get(key).push(Date.now());
}

function clearAuthFailures(sourceIp) {
  authFailureMap.delete(sourceIp);
}

/**
 * User registration
 */
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      req.authFailure = true;
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user'
      }
    });

    // Generate token
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
}

/**
 * User login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { getClientIp } = require('../utils/ip');
    const sourceIp = getClientIp(req);

    // Pre-authentication rate limiting
    const rateLimitResult = checkAuthRateLimit(sourceIp);
    if (!rateLimitResult.allowed) {
      req.authFailure = true;
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Validate input
    if (!email || !password) {
      req.authFailure = true;
      recordAuthFailure(sourceIp);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      req.authFailure = true;
      recordAuthFailure(sourceIp);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      req.authFailure = true;
      recordAuthFailure(sourceIp);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Clear auth failures on successful login
    clearAuthFailures(sourceIp);

    // Generate token
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}

/**
 * User logout
 */
async function logout(req, res) {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout successful'
  });
}

/**
 * Get current user
 */
async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
}

/**
 * Get socket token for authentication
 */
async function getSocketToken(req, res) {
  try {
    // Generate a temporary token for socket authentication
    const token = generateToken(req.user);
    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Get socket token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate socket token'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  getSocketToken,
  checkAuthRateLimit,
  recordAuthFailure,
  clearAuthFailures
};

const prisma = require('../config/database');

/**
 * Demo dashboard data
 */
async function getDashboard(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email
        },
        stats: {
          totalRequests: 0,
          securityEvents: 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard'
    });
  }
}

/**
 * Demo profile page
 */
async function getProfile(req, res) {
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
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load profile'
    });
  }
}

/**
 * Demo search functionality
 */
async function search(req, res) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Safe search - this is a demo, just return mock results
    const results = [
      { id: 1, title: `Result for "${query}"`, type: 'article' },
      { id: 2, title: `Another result for "${query}"`, type: 'document' }
    ];

    res.json({
      success: true,
      query,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
}

/**
 * Demo contact form
 */
async function contact(req, res) {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Just acknowledge the message
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
}

/**
 * Protected API route
 */
async function protectedData(req, res) {
  try {
    // This is a protected route that requires authentication
    res.json({
      success: true,
      message: 'This is protected data',
      timestamp: new Date().toISOString(),
      userId: req.user.id
    });
  } catch (error) {
    console.error('Protected data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load protected data'
    });
  }
}

/**
 * Public API route
 */
async function publicData(req, res) {
  try {
    // This is a public route that doesn't require authentication
    res.json({
      success: true,
      message: 'This is public data',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Public data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load public data'
    });
  }
}

module.exports = {
  getDashboard,
  getProfile,
  search,
  contact,
  protectedData,
  publicData
};

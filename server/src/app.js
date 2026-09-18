const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const prisma = require('./config/database');
const { createIDPSMiddleware, getInspector } = require('./middleware/idps');
const setupSocketIO = require('./sockets');

// Import routes
const authRoutes = require('./routes/auth');
const demoRoutes = require('./routes/demo');
const adminRoutes = require('./routes/admin');
const testLabRoutes = require('./routes/testLab');

// Create Express app
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false // Same origin in production
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Initialize IDPS middleware (will be set up after server creation)
let idpsMiddleware = (req, res, next) => {
  const inspector = getInspector();
  if (inspector) {
    return inspector.inspect(req, res, next);
  }
  next();
};

// API routes (protected by IDPS)
app.use('/api/auth', idpsMiddleware, authRoutes);
app.use('/api/demo', idpsMiddleware, demoRoutes);
app.use('/api/admin', idpsMiddleware, adminRoutes);

// Test Lab admin operations bypass IDPS (must be registered before IDPS-protected router)
app.use('/api/test-lab', testLabRoutes.adminRouter);
app.use('/api/test-lab', idpsMiddleware, testLabRoutes);

// Public API route (not protected by IDPS for testing)
app.get('/api/public', (req, res) => {
  res.json({
    success: true,
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize IDPS with Socket.IO
function initializeIDPS(io) {
  const middleware = createIDPSMiddleware(io);
  idpsMiddleware = middleware;

  // Load saved mode from database
  prisma.systemSetting.findUnique({
    where: { key: 'idps_mode' }
  }).then(setting => {
    if (setting) {
      const inspector = getInspector();
      if (inspector) {
        inspector.setMode(setting.value);
        console.log(`IDPS mode loaded: ${setting.value}`);
      }
    }
  }).catch(err => {
    console.error('Error loading IDPS mode:', err);
  });
}

module.exports = { app, initializeIDPS };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const prisma = require('./config/database');
const { createIDPSMiddleware, getInspector } = require('./middleware/idps');
const { corsOptions } = require('./config/origins');

// Import routes
const authRoutes = require('./routes/auth');
const demoRoutes = require('./routes/demo');
const adminRoutes = require('./routes/admin');
const testLabRoutes = require('./routes/testLab');
const { authenticate, requireAdmin } = require('./middleware/auth');

// Create Express app
const app = express();
app.disable('etag');
const trustedProxy = process.env.TRUSTED_PROXY;
if (trustedProxy === 'true') throw new Error('TRUSTED_PROXY must name trusted proxy IPs/subnets, not true');
app.set('trust proxy', trustedProxy && trustedProxy !== 'false' ? trustedProxy.split(',').map(value => value.trim()) : false);

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? { directives: { upgradeInsecureRequests: null } }
    : false
}));

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  // Discard validators from older cached API responses; probes need a fresh result.
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Initialize IDPS middleware (will be set up after server creation)
let idpsMiddleware = (req, res, next) => {
  const inspector = getInspector();
  if (inspector) {
    return inspector.inspect(req, res, next).catch(next);
  }
  next();
};

// API routes (protected by IDPS)
app.use('/api/auth', (req, res, next) => {
  if (req.method === 'GET' || req.path === '/logout') return next();
  return idpsMiddleware(req, res, next);
}, authRoutes);
app.use('/api/demo', idpsMiddleware, demoRoutes);
// Keep authenticated management reachable during local IPS testing.
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// Test Lab admin operations bypass IDPS (must be registered before IDPS-protected router)
app.use('/api/test-lab', testLabRoutes.adminRouter);
app.use('/api/test-lab', authenticate, requireAdmin, testLabRoutes);

// Public API route (not protected by IDPS for testing)
app.get('/api/public', (req, res) => {
  res.json({
    success: true,
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
  } catch {
    res.status(503).json({ success: false, status: 'unavailable' });
  }
});

// Serve static files in production
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Request error:', err.type || err.name || 'Error');
  const status = err.status === 400 || err.status === 413 ? err.status : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid request body' : status === 413 ? 'Payload too large' : 'Internal server error'
  });
});

// Initialize IDPS with Socket.IO
async function initializeIDPS(io) {
  const middleware = createIDPSMiddleware(io);
  idpsMiddleware = middleware;

  // Load saved mode from database
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'idps_mode' }
  });
    if (setting) {
      const inspector = getInspector();
      if (inspector) {
        inspector.setMode(setting.value);
        console.log(`IDPS mode loaded: ${setting.value}`);
      }
    }
  await getInspector().detectors.loadDisabledDetectors();
}

module.exports = { app, initializeIDPS };

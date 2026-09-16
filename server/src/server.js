const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('./app');
const prisma = require('./config/database');
const setupSocketIO = require('./sockets');

const PORT = process.env.NODE_ENV === 'production' ? 8080 : (process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? false
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

setupSocketIO(io);

// Initialize IDPS with Socket.IO
initializeIDPS(io);

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Start listening
    server.listen(PORT, HOST, () => {
      console.log(`WebShield server running on http://${HOST}:${PORT}`);
      console.log(`Admin dashboard: http://localhost:${PORT}`);
      console.log(`For LAN access: http://<YOUR_LAN_IP>:${PORT}`);
      console.log(`To find your LAN IP, run: ipconfig (Windows) or ifconfig (Linux/Mac)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

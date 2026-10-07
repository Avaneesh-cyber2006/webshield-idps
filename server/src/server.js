require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const http = require('http');
const { Server } = require('socket.io');
const { app, initializeIDPS } = require('./app');
const prisma = require('./config/database');
const setupSocketIO = require('./sockets');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, { cors: require('./config/origins').corsOptions });

setupSocketIO(io);

// Initialize IDPS with Socket.IO

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    await initializeIDPS(io);
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

/**
 * Socket.IO Setup
 * Handles real-time updates for the admin dashboard
 */
const { verifyToken } = require('../middleware/auth');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join admin room with authentication
    let expiryTimer;
    socket.on('join-admin', async (token) => {
      try {
        socket.leave('admin');
        clearTimeout(expiryTimer);
        const decoded = verifyToken(token);
        const user = decoded && await require('../config/database').user.findUnique({ where: { id: decoded.id } });
        if (!user || user.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized: Admin access required' });
          return;
        }
        socket.join('admin');
        expiryTimer = setTimeout(() => socket.leave('admin'), Math.max(0, decoded.exp * 1000 - Date.now()));
        expiryTimer.unref();
        console.log('Admin client joined admin room:', socket.id);
        socket.emit('joined-admin', { success: true });
      } catch (error) {
        console.error('Socket auth error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Leave admin room
    socket.on('leave-admin', () => {
      clearTimeout(expiryTimer);
      socket.leave('admin');
      console.log('Client left admin room:', socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      clearTimeout(expiryTimer);
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = setupSocketIO;

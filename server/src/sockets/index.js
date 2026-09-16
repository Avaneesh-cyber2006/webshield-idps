/**
 * Socket.IO Setup
 * Handles real-time updates for the admin dashboard
 */
const { verifyToken } = require('../middleware/auth');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join admin room with authentication
    socket.on('join-admin', (token) => {
      try {
        const decoded = verifyToken(token);
        if (decoded.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized: Admin access required' });
          return;
        }
        socket.join('admin');
        console.log('Admin client joined admin room:', socket.id);
        socket.emit('joined-admin', { success: true });
      } catch (error) {
        console.error('Socket auth error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Leave admin room
    socket.on('leave-admin', () => {
      socket.leave('admin');
      console.log('Client left admin room:', socket.id);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = setupSocketIO;

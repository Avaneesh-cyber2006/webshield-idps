/**
 * Socket.IO Setup
 * Handles real-time updates for the admin dashboard
 */
function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join admin room for security updates
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log('Client joined admin room:', socket.id);
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

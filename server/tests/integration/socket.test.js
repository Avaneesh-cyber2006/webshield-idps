require('../setup-test-db');
const assert = require('assert/strict');
const http = require('http');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const request = require('supertest');
const { app, initializeIDPS } = require('../../src/app');
const prisma = require('../../src/config/database');
const { generateToken } = require('../../src/middleware/auth');
const setupSocketIO = require('../../src/sockets');
const once = (socket, event) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Timed out waiting for ' + event)), 3000);
  socket.once(event, value => { clearTimeout(timer); resolve(value); });
});
async function main() {
  const server = http.createServer(app);
  const io = new Server(server);
  setupSocketIO(io);
  await initializeIDPS(io);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const socket = connect('http://127.0.0.1:' + server.address().port, { transports: ['websocket'], autoConnect: false });
  try {
    const connected = once(socket, 'connect'); socket.connect(); await connected;
    const rejected = once(socket, 'error'); socket.emit('join-admin', 'invalid'); await rejected;
    const admin = await prisma.user.findUnique({ where: { email: 'admin@webshield.local' } });
    const joined = once(socket, 'joined-admin'); socket.emit('join-admin', generateToken(admin)); await joined;
    const event = once(socket, 'security:new');
    const response = await request(server).get('/api/demo/search').query({ query: "' OR '1'='1" }).set('User-Agent', 'Mozilla/5.0');
    assert.equal(response.status, 200);
    assert.equal((await event).attackType, 'SQL_INJECTION');
    console.log('PASS: real Socket.IO authentication and live security event delivery');
  } finally {
    socket.disconnect();
    await new Promise(resolve => io.close(resolve));
    await new Promise(resolve => setTimeout(resolve, 50));
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exit(1); });

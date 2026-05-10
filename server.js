const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static(path.join(__dirname, 'image')));

const rooms = {};

const COLORS = ['#ff9eb5', '#98d8c8', '#b5c9ff', '#ffd89e', '#d4b5ff', '#aff5c0', '#ffc9c9', '#c9eeff'];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

io.on('connection', (socket) => {
  let roomCode = null;

  socket.on('create-room', ({ name }, cb) => {
    let code;
    do { code = generateCode(); } while (rooms[code]);

    rooms[code] = { users: {} };
    roomCode = code;

    const idx = Object.keys(rooms[code].users).length;
    rooms[code].users[socket.id] = {
      id: socket.id,
      name: name || '익명',
      color: COLORS[idx % COLORS.length],
      joinTime: Date.now()
    };

    socket.join(code);
    cb({ success: true, code, users: rooms[code].users, myId: socket.id });
    io.to(code).emit('room-update', { users: rooms[code].users });
  });

  socket.on('join-room', ({ name, code }, cb) => {
    const c = (code || '').toUpperCase().trim();
    if (!rooms[c]) return cb({ success: false, error: '방을 찾을 수 없어요.' });

    roomCode = c;
    const idx = Object.keys(rooms[c].users).length;
    rooms[c].users[socket.id] = {
      id: socket.id,
      name: name || '익명',
      color: COLORS[idx % COLORS.length],
      joinTime: Date.now()
    };

    socket.join(c);
    cb({ success: true, code: c, users: rooms[c].users, myId: socket.id });
    io.to(c).emit('room-update', { users: rooms[c].users });
  });

  socket.on('key-event', ({ key, type }) => {
    if (roomCode && rooms[roomCode]) {
      socket.to(roomCode).emit('user-key-event', { userId: socket.id, key, type });
    }
  });

  socket.on('mouse-move', ({ x, y }) => {
    if (roomCode && rooms[roomCode]) {
      socket.to(roomCode).emit('user-mouse-move', { userId: socket.id, x, y });
    }
  });

  socket.on('disconnect', () => {
    if (roomCode && rooms[roomCode]) {
      delete rooms[roomCode].users[socket.id];
      if (Object.keys(rooms[roomCode].users).length === 0) {
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit('room-update', { users: rooms[roomCode].users });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

function startServer(callback) {
  server.listen(PORT, () => {
    console.log(`햄스터디: http://localhost:${PORT}`);
    if (callback) callback();
  });
}

// 직접 실행 시 바로 시작, require 시 함수 export
if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}

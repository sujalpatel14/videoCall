const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const port = 'https://videocall-ftzv.onrender.com'

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: port,  // Ensure no trailing slash here
    methods: ['GET', 'POST'],
  }
});

app.use(cors({
  origin: port, // Ensure no trailing slash
  methods: ['GET', 'POST']
}));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('call-user', (data) => {
    io.to(data.to).emit('incoming-call', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('answer-call', (data) => {
    io.to(data.to).emit('call-answered', {
      answer: data.answer,
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});

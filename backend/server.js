const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/tokenRoutes');

dotenv.config();
const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Make io accessible to routes
app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/audit', require('./routes/auditRoutes'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  // Join queue room for queue-specific updates
  socket.on('join-queue-room', (queueId) => {
    socket.join(`queue-${queueId}`);
    console.log(`User joined queue room: ${queueId}`);
  });

  // Leave queue room
  socket.on('leave-queue-room', (queueId) => {
    socket.leave(`queue-${queueId}`);
    console.log(`User left queue room: ${queueId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server, io };
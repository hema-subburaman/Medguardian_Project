import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db.js';
import { initSocket } from './websocket/socketHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});
initSocket(io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'MedGuardian MERN + IoT Healthcare Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulation', simulationRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  MEDGUARDIAN CLINICAL BACKEND (Node.js + Express)`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Socket.IO real-time engine active`);
  console.log(`==================================================`);
});

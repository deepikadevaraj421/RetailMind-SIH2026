import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { connectDB } from './utils/db.js';
import { loadDatasetAndSeed } from './services/datasetLoader.js';
import { simulationEngine } from './simulation/simulationEngine.js';
import { SettingsService } from './services/settingsService.js';
import { createApiRouter } from './routes/api.js';

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

  app.use(cors());
  app.use(express.json());

  // Serve static frontend files in production
  if (process.env.NODE_ENV === 'production') {
    const staticPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  // Attach Socket.IO to simulation engine and settings service
  simulationEngine.setSocketServer(io);
  SettingsService.setSocketServer(io);


// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api', createApiRouter(io));

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  console.log('==============================================');
  console.log('     RETAILMIND — Edge-AI Retail Copilot      ');
  console.log('          Phase 1: Cameras & Timeline         ');
  console.log('==============================================');

  // Attempt DB Connection
  await connectDB();

  // Load Dataset & Seed
  try {
    await loadDatasetAndSeed();
  } catch (err: any) {
    console.error('[SEED] Could not load dataset:', err.message);
  }

  // Initialize Settings
  try {
    await SettingsService.init();
  } catch (err: any) {
    console.error('[SETTINGS] Could not initialize settings:', err.message);
  }

  // Start Live Simulation Engine if enabled
  if (process.env.SIMULATION_ENABLED !== 'false') {
    const interval = parseInt(process.env.SIMULATION_INTERVAL_MS || '4000', 10);
    simulationEngine.start(interval);
  }

  server.listen(PORT, () => {
    console.log(`[SERVER] RetailMind backend running at http://localhost:${PORT}`);
    console.log(`[SERVER] Health endpoint at http://localhost:${PORT}/api/health`);
    console.log(`[SERVER] Cameras endpoint at http://localhost:${PORT}/api/cameras`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Fatal error during startup:', err);
});

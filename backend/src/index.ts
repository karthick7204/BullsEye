import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import stockRoutes from './routes/stockRoutes';
import patternRoutes from './routes/patternRoutes';
import scannerRoutes from './routes/scannerRoutes';
import alertRoutes from './routes/alertRoutes';
import { scannerService } from './services/scannerService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'BullsEye Automated Breakout Pattern Detection API',
    timestamp: new Date().toISOString(),
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 BullsEye Backend Server running on port ${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/patterns/active`);
  console.log(`   - GET  /api/patterns/scan/:symbol`);
  console.log(`   - GET  /api/stocks/:symbol/chart`);
  console.log(`   - GET  /api/scanner/status`);
  console.log(`   - POST /api/scanner/run`);
  console.log(`   - GET  /api/alerts`);
  console.log(`=======================================================`);

  // Start periodic background scanner (every 5 minutes, with initial scan immediately)
  scannerService.startPeriodicScan(5);
});

export default app;


import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from 'dotenv';
import { DatabaseConnections } from './config/database';
import databaseRouter from './routes/database';
import schemaRouter from './routes/schema';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MDB Backend API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/databases', databaseRouter);
app.use('/api/schema', schemaRouter);

app.use('/api', (_req, res) => {
  res.json({
    message: 'Multi-Database Management System API',
    endpoints: {
      health: '/health',
      databases: '/api/databases',
      schema: '/api/schema',
      address: '/api/address',
      sync: '/api/sync',
      reports: '/api/reports'
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 MDB Backend server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database connections
  const dbManager = DatabaseConnections.getInstance();
  console.log('🔌 Initializing database connections...');
  await dbManager.connectAll();
});

export default app;

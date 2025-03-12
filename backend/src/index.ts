import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { logger } from './config/logger';
import urlRoutes from './routes/urlRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/url', urlRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.nodeEnv} mode`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});
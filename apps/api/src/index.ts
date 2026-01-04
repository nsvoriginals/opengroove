import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initSocketLayer } from './socket/index.js';
import { rClient } from './config/redis.config.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';


rClient.connect()
  .then(() => logger.info(' Connected to Redis'))
  .catch((err) => {
    logger.error(' Redis connection error:', err.message);
    logger.warn('  Server will start without Redis. Some features may not work.');
    logger.info(' To fix: docker run -d -p 6379:6379 redis');
  });
const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

initSocketLayer(httpServer);

rClient.connect()
  .then(() => logger.info('Connected to Redis'))
  .catch((err:any) => logger.error('Redis connection error:', err));

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`REST API: http://localhost:${PORT}/api`);
  logger.info(`WebSocket: ws://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing server');
  await rClient.quit();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing server');
  await rClient.quit();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

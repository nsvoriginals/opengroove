import { Router } from 'express';
import { rClient } from '../config/redis.config.js';
const router:Router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/detailed', async (req, res) => {
  try {
    const redisPing = await rClient.ping();
    const redisConnected = redisPing === 'PONG';

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: {
          status: redisConnected ? 'connected' : 'disconnected',
          ping: redisPing,
        },
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

export default router;

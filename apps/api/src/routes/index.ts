import { Router } from 'express';
import healthRouter from './health.route.js';
import roomRouter from './room.route.js';

const router:Router = Router();

router.use('/health', healthRouter);
router.use('/rooms', roomRouter);

router.get('/', (req, res) => {
  res.json({
    name: 'OpenGroove API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      rooms: '/rooms',
      socket: 'ws://localhost:4000',
    },
  });
});

export default router;
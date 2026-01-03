import { createClient } from 'redis';
import { RedisClientType } from 'redis';

export const rClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return retries * 100; 
    }
  }
});


rClient.on('error', (err) => console.error('Redis Client Error:', err));
rClient.on('connect', () => console.log('Redis Client Connected'));
rClient.on('ready', () => console.log('Redis Client Ready'));
rClient.on('reconnecting', () => console.log('Redis Client Reconnecting...'));
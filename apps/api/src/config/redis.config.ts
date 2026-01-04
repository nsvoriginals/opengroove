import { createClient, RedisClientType } from 'redis';

export const rClient:RedisClientType = createClient({
  url: "rediss://default:ATzdAAIncDE3NTRlN2JlMjc5YzE0MDNhYmQ3MmI0MDkwN2M1OWFiN3AxMTU1ODE@cuddly-wren-15581.upstash.io:6379",
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

rClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
  console.log(' Tip: Start Redis with "docker run -d -p 6379:6379 redis"');
});
rClient.on('connect', () => console.log(' Redis Client Connected'));
rClient.on('ready', () => console.log(' Redis Client Ready'));
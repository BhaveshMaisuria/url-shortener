import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  // Clear the Redis database before each test suite to prevent rate limits
  // and cached data from bleeding across tests.
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });
  
  await redis.flushall();
  redis.disconnect();
});

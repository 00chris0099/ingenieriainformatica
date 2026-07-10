// Server-only Redis module - do NOT import in client components
// This file should only be imported in API routes (server-side)

let redisInstance: any = null;

function getRedis() {
  if (redisInstance) return redisInstance;

  if (typeof window !== 'undefined') {
    // Client side - return mock
    return createMockRedis();
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return createMockRedis();
  }

  try {
    // Dynamic import to avoid bundling ioredis in client
    const Redis = require('ioredis');
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redisInstance.on('error', () => {});
    redisInstance.on('connect', () => console.log('[Redis] Conectado'));
    return redisInstance;
  } catch {
    return createMockRedis();
  }
}

function createMockRedis() {
  return {
    async get() { return null; },
    async set() { return 'OK'; },
    async setex() { return 'OK'; },
    async del() { return 1; },
    async keys() { return []; },
    async incr() { return 1; },
    async expire() { return 1; },
  };
}

export const redis = getRedis();
export default redis;

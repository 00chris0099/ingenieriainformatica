import { redis } from './redis';

const DEFAULT_TTL = 300; // 5 minutes

// Get cached value or execute function and cache result
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis unavailable, proceed without cache
  }

  const result = await fn();

  try {
    await redis.setex(key, ttl, JSON.stringify(result));
  } catch {
    // Redis unavailable, skip caching
  }

  return result;
}

// Invalidate cache by key pattern
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable
  }
}

// Rate limiting
export async function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
    };
  } catch {
    // Redis unavailable, allow request
    return { allowed: true, remaining: maxRequests };
  }
}

// Simple cache set/get
export async function cacheSet(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {}
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

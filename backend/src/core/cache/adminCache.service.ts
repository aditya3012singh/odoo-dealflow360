import RedisClient from './redis.client.js';
import logger from '../logger/structuredLogger.js';

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Two-Tier Resilient Caching Service
 * Tier 1: In-Memory Fast Cache (< 0.05ms)
 * Tier 2: Redis Distributed Cache (< 2ms)
 * Graceful fallback if Redis is unreachable.
 */
export class AdminCacheService {
  private static memoryCache = new Map<string, MemoryCacheEntry<any>>();

  /**
   * Retrieve item from cache (checks In-Memory first, then Redis)
   */
  static async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // 1. Tier 1: In-Memory Cache Check
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt > now) {
        return memEntry.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Tier 2: Redis Cache Check
    try {
      const redis = RedisClient.client;
      if (redis) {
        const raw = await redis.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Backfill In-Memory cache for subsequent ultra-fast reads (30s default backfill)
          this.memoryCache.set(key, { value: parsed, expiresAt: now + 30000 });
          return parsed as T;
        }
      }
    } catch (err: any) {
      logger.warn(`[AdminCache] Redis read failed for key ${key}: ${err.message}`);
    }

    return null;
  }

  /**
   * Store item in both Tier 1 and Tier 2 caches
   */
  static async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    const now = Date.now();

    // 1. Store in Tier 1 In-Memory Cache
    this.memoryCache.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
    });

    // 2. Store in Tier 2 Redis Cache
    try {
      const redis = RedisClient.client;
      if (redis) {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      }
    } catch (err: any) {
      logger.warn(`[AdminCache] Redis write failed for key ${key}: ${err.message}`);
    }
  }

  /**
   * Delete a specific key from both caches
   */
  static async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      const redis = RedisClient.client;
      if (redis) {
        await redis.del(key);
      }
    } catch (err: any) {
      logger.warn(`[AdminCache] Redis del failed for key ${key}: ${err.message}`);
    }
  }

  /**
   * Invalidate all keys matching a prefix or wildcard pattern
   * e.g. "admin:policies*", "admin:warehouses*"
   */
  static async delPattern(pattern: string): Promise<void> {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    // Evict matching keys from In-Memory Cache
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Evict matching keys from Redis
    try {
      const redis = RedisClient.client;
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys && keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (err: any) {
      logger.warn(`[AdminCache] Redis delPattern failed for ${pattern}: ${err.message}`);
    }
  }

  /**
   * Get or compute pattern: fetches from cache if available, else executes fetcher and caches
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }
}

export default AdminCacheService;

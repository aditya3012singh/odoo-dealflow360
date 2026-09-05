import RedisClient from '../../core/cache/redis.client.js';
import { prisma } from '../../core/config/db.js';
import structuredLogger from '../../core/logger/structuredLogger.js';

export interface CachedPolicy {
  maxDiscount: number;
  minMargin: number | null;
}

const POLICY_PREFIX = 'discount:policy:';
const TTL = 3600; // 1 hour

export class PolicyCache {
  /**
   * Get discount policy for a given customer tier and product category
   */
  static async get(customerTierId: string, categoryId?: string): Promise<CachedPolicy> {
    const redis = RedisClient.client;
    const cacheKey = `${POLICY_PREFIX}${customerTierId}:${categoryId || 'default'}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        structuredLogger.warn(`[PolicyCache] Redis read error: ${err}`);
      }
    }

    // Query PostgreSQL
    let policy = await prisma.discountPolicy.findFirst({
      where: {
        customerTierId,
        categoryId: categoryId || undefined,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    // Fallback to customer tier default discount if no category-specific policy
    if (!policy) {
      const tier = await prisma.customerTier.findUnique({
        where: { id: customerTierId },
      });
      const maxDiscount = tier ? Number(tier.defaultDiscount) : 10.0;
      const result: CachedPolicy = { maxDiscount, minMargin: 20.0 };

      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(result), 'EX', TTL);
        } catch {
          // ignore cache write error
        }
      }
      return result;
    }

    const result: CachedPolicy = {
      maxDiscount: Number(policy.maxDiscount),
      minMargin: policy.minMargin ? Number(policy.minMargin) : null,
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), 'EX', TTL);
      } catch {
        // ignore cache write error
      }
    }

    return result;
  }

  /**
   * Invalidate cached policy on policy update
   */
  static async invalidate(customerTierId: string, categoryId?: string): Promise<void> {
    const redis = RedisClient.client;
    if (!redis) return;
    try {
      const cacheKey = `${POLICY_PREFIX}${customerTierId}:${categoryId || 'default'}`;
      await redis.del(cacheKey);
    } catch (err) {
      structuredLogger.warn(`[PolicyCache] Invalidation error: ${err}`);
    }
  }
}

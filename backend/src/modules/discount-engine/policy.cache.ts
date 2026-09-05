import RedisClient from '../../core/cache/redis.client.js';
import { prisma } from '../../core/config/db.js';
import structuredLogger from '../../core/logger/structuredLogger.js';

export interface CachedPolicy {
  maxDiscount: number;
  minMargin: number | null;
  /** Which level the policy was resolved from — useful for explainability */
  policySource: 'PRODUCT' | 'CATEGORY' | 'TIER' | 'GLOBAL_DEFAULT';
  policyId?: string;
}

const POLICY_PREFIX = 'discount:policy:';
const TTL = 3600; // 1 hour

export class PolicyCache {
  /**
   * Get the most restrictive applicable discount policy using explicit precedence:
   *   1. Product-specific policy (categoryId + customerTierId)
   *   2. Category-only policy (categoryId, any tier)
   *   3. Customer-tier default discount
   *   4. Global hardcoded default (10%)
   *
   * The most specific / most restrictive rule wins.
   */
  static async get(customerTierId: string, categoryId?: string, productId?: string): Promise<CachedPolicy> {
    const redis = RedisClient.client;
    const cacheKey = `${POLICY_PREFIX}${customerTierId}:${categoryId || 'none'}:${productId || 'none'}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        structuredLogger.warn(`[PolicyCache] Redis read error: ${err}`);
      }
    }

    let result: CachedPolicy;

    // Level 1: product-specific + tier policy
    if (categoryId) {
      const productTierPolicy = await prisma.discountPolicy.findFirst({
        where: { customerTierId, categoryId, isActive: true },
        orderBy: { priority: 'desc' },
      });
      if (productTierPolicy) {
        result = {
          maxDiscount: Number(productTierPolicy.maxDiscount),
          minMargin: productTierPolicy.minMargin ? Number(productTierPolicy.minMargin) : null,
          policySource: 'PRODUCT',
          policyId: productTierPolicy.id,
        };
        await PolicyCache._cache(redis, cacheKey, result);
        return result;
      }

      // Level 2: category-level policy (no tier restriction)
      const categoryPolicy = await prisma.discountPolicy.findFirst({
        where: { categoryId, isActive: true },
        orderBy: { priority: 'desc' },
      });
      if (categoryPolicy) {
        result = {
          maxDiscount: Number(categoryPolicy.maxDiscount),
          minMargin: categoryPolicy.minMargin ? Number(categoryPolicy.minMargin) : null,
          policySource: 'CATEGORY',
          policyId: categoryPolicy.id,
        };
        await PolicyCache._cache(redis, cacheKey, result);
        return result;
      }
    }

    // Level 3: customer tier default
    const tier = await prisma.customerTier.findUnique({ where: { id: customerTierId } });
    if (tier && Number(tier.defaultDiscount) > 0) {
      result = {
        maxDiscount: Number(tier.defaultDiscount),
        minMargin: 20.0,
        policySource: 'TIER',
        policyId: tier.id,
      };
      await PolicyCache._cache(redis, cacheKey, result);
      return result;
    }

    // Level 4: global default
    result = { maxDiscount: 10.0, minMargin: 20.0, policySource: 'GLOBAL_DEFAULT' };
    await PolicyCache._cache(redis, cacheKey, result);
    return result;
  }

  private static async _cache(redis: any, key: string, value: CachedPolicy): Promise<void> {
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', TTL);
    } catch {
      // Ignore cache write error — DB is source of truth
    }
  }

  /**
   * Invalidate cached policy on policy update
   */
  static async invalidate(customerTierId: string, categoryId?: string): Promise<void> {
    const redis = RedisClient.client;
    if (!redis) return;
    try {
      // Use pattern-based invalidation since we have productId in the key now
      const pattern = `${POLICY_PREFIX}${customerTierId}:${categoryId || '*'}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch (err) {
      structuredLogger.warn(`[PolicyCache] Invalidation error: ${err}`);
    }
  }
}

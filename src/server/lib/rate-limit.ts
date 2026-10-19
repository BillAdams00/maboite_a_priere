import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '../env';

export type RateLimitAction =
  | 'prayerSubmission'
  | 'prayAction'
  | 'adminMagicLink'
  | 'prayerCount'
  | 'expressModeration';

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  upstashWindow: `${number} ${'s' | 'm' | 'h' | 'd'}`;
  prefix: string;
}

const LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  prayerSubmission: {
    requests: 5,
    windowMs: 60 * 60 * 1000,
    upstashWindow: '1 h',
    prefix: 'ratelimit:prayer-submission',
  },
  prayAction: {
    requests: 30,
    windowMs: 60 * 60 * 1000,
    upstashWindow: '1 h',
    prefix: 'ratelimit:pray-action',
  },
  adminMagicLink: {
    requests: 5,
    windowMs: 60 * 60 * 1000,
    upstashWindow: '1 h',
    prefix: 'ratelimit:admin-magic-link',
  },
  prayerCount: {
    requests: 60,
    windowMs: 60 * 1000,
    upstashWindow: '1 m',
    prefix: 'ratelimit:prayer-count',
  },
  expressModeration: {
    requests: 10,
    windowMs: 60 * 60 * 1000,
    upstashWindow: '1 h',
    prefix: 'ratelimit:express-moderation',
  },
};

/**
 * Repli mémoire local pour le développement et les tests lorsque Upstash n'est pas configuré
 */
class InMemoryRateLimiter {
  private static store = new Map<string, { count: number; expiresAt: number }>();

  static async check(action: RateLimitAction, identifier: string) {
    const config = LIMITS[action];
    const now = Date.now();
    const key = `${config.prefix}:${identifier}`;
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.store.set(key, { count: 1, expiresAt: now + config.windowMs });
      return { success: true, remaining: config.requests - 1, reset: now + config.windowMs };
    }

    if (entry.count >= config.requests) {
      return { success: false, remaining: 0, reset: entry.expiresAt };
    }

    entry.count += 1;
    return {
      success: true,
      remaining: config.requests - entry.count,
      reset: entry.expiresAt,
    };
  }
}

let redisInstance: Redis | null = null;
const upstashLimiters = new Map<RateLimitAction, Ratelimit>();

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redisInstance = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  for (const [actionKey, config] of Object.entries(LIMITS) as [RateLimitAction, RateLimitConfig][]) {
    upstashLimiters.set(
      actionKey,
      new Ratelimit({
        redis: redisInstance,
        limiter: Ratelimit.slidingWindow(config.requests, config.upstashWindow),
        prefix: config.prefix,
      })
    );
  }
}

/**
 * Contrôle de limitation de débit (Rate Limiting)
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset?: number }> {
  const limiter = upstashLimiters.get(action);

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error(`Erreur RateLimit Upstash pour ${action} :`, error);
      // En production, si Upstash tombe, on trace l'erreur
      if (process.env.NODE_ENV === 'production') {
        return { success: true, remaining: 1 };
      }
    }
  }

  // Repli en mémoire en environnement de développement / test
  return await InMemoryRateLimiter.check(action, identifier);
}

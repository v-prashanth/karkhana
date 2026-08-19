import { Redis } from "@upstash/redis";

// Upstash Redis Client Initialization
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isValidUrl = redisUrl && redisUrl.startsWith("https://");

const redis = isValidUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// In-Memory Fallback Map (for local testing or when Upstash Redis env vars are not set)
const memoryStore = new Map<string, { count: number; reset: number }>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate Limiter function using Upstash Redis with in-memory fallback
 * @param key Unique identifier key (e.g., "otp:9876543210" or "login:192.168.1.1")
 * @param limit Number of allowed attempts
 * @param windowSeconds Time window in seconds
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Date.now();
  const reset = now + windowSeconds * 1000;

  // Mode A: Upstash Redis (Production / Configured env)
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      return {
        success: current <= limit,
        limit,
        remaining: Math.max(0, limit - current),
        reset,
      };
    } catch (err) {
      console.warn("⚠️ Upstash Redis error, falling back to memory store:", err);
    }
  }

  // Mode B: In-Memory Sliding Map (Local Dev / Fallback)
  const existing = memoryStore.get(key);

  if (!existing || now > existing.reset) {
    memoryStore.set(key, { count: 1, reset });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    };
  }

  existing.count += 1;
  const success = existing.count <= limit;

  return {
    success,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
  };
}

export const LIMITS = {
  OTP_REQUESTS: { limit: 5, window: 3600 }, // 5 per hour per phone
  LOGIN_ATTEMPTS: { limit: 5, window: 900 }, // 5 per 15 min per IP
  REGISTER: { limit: 10, window: 3600 },     // 10 per hour per IP
};

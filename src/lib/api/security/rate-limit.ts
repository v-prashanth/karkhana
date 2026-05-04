import { Redis } from "@upstash/redis";

// Only initialize if we have the environment variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isValidUrl = redisUrl && redisUrl.startsWith("https://");

const redis = isValidUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Basic sliding window rate limiter
 * @param key The unique key to rate limit (e.g., "otp:9876543210" or "ip:192.168.1.1")
 * @param limit Number of allowed requests
 * @param windowSeconds Time window in seconds
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  // If Redis is not configured, we bypass rate limiting (useful for local dev without env vars)
  if (!redis) {
    console.warn("⚠️ UPSTASH_REDIS_REST_URL is not set. Rate limiting is disabled.");
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Date.now() + windowSeconds * 1000,
    };
  }

  const now = Date.now();
  const reset = now + windowSeconds * 1000;
  
  // Use a simple counter with expiration
  // A true sliding window requires sorted sets, but this is sufficient for basic limits
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
}

export const LIMITS = {
  OTP_REQUESTS: { limit: 5, window: 3600 }, // 5 per hour
  LOGIN_ATTEMPTS: { limit: 5, window: 900 }, // 5 per 15 mins
  EMAIL_REGISTER: { limit: 10, window: 3600 }, // 10 per hour per IP
  PASSWORD_RESET: { limit: 3, window: 3600 }, // 3 per hour
};

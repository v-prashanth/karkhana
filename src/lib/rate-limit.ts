/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * Zero external dependencies. Suitable for single-instance deployments.
 * For multi-instance (load-balanced), upgrade to Upstash Redis.
 * 
 * Usage:
 *   const limiter = rateLimit({ maxRequests: 5, windowMs: 60 * 60 * 1000 });
 *   const { success, remaining } = limiter.check(identifier);
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface WindowEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, WindowEntry>>();

// Garbage collect expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  stores.forEach((store, storeName) => {
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t: number) => now - t < 3600000); // Keep max 1hr
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    });
    if (store.size === 0) {
      stores.delete(storeName);
    }
  });
}, 5 * 60 * 1000);

export function rateLimit(name: string, config: RateLimitConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let entry = store.get(identifier);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
      }

      // Remove timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((t: number) => t > windowStart);

      if (entry.timestamps.length >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        return {
          success: false,
          remaining: 0,
          resetAt: oldestInWindow + config.windowMs,
        };
      }

      // Record this request
      entry.timestamps.push(now);

      return {
        success: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetAt: now + config.windowMs,
      };
    },
  };
}

// ─── Pre-configured limiters ─────────────────────────────────────

/** 5 OTP requests per email per hour */
export const otpRequestLimiter = rateLimit("otp-request", {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

/** 20 user-check requests per IP per minute */
export const userCheckLimiter = rateLimit("user-check", {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
});

/** 3 registration attempts per IP per hour */
export const registerLimiter = rateLimit("register", {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
});

/** 10 OTP verify attempts per email per 15 minutes (brute-force protection) */
export const otpVerifyLimiter = rateLimit("otp-verify", {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

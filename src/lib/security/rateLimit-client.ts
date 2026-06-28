"use client";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const FORGOT_PASSWORD_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3, // 3 attempts per 15 min
};

export function checkForgotPasswordRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + FORGOT_PASSWORD_CONFIG.windowMs });
    return { allowed: true, remaining: FORGOT_PASSWORD_CONFIG.maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= FORGOT_PASSWORD_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: FORGOT_PASSWORD_CONFIG.maxRequests - record.count, retryAfter: 0 };
}
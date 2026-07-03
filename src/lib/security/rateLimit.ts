import "server-only";
/**
 * Rate limiting utilities for Sadat MLS Cloud.
 * Includes middleware, risk-based configs, and IP-based tracking.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Rate limiting storage with automatic cleanup
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// Custom error class for rate limiting
export class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number, public remainingRequests?: number, public resetTime?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Enhanced RateLimitConfig with security features
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: 'off' | 'draft-6' | 'draft-7';
  legacyHeaders?: boolean;
  errorResponse?: (request: NextRequest, context: { remaining: number; resetTime: number; }) => NextResponse;
}

// Risk-based rate limiting for sensitive endpoints
export enum RateLimitRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const RateLimitRiskConfigs = {
  [RateLimitRiskLevel.LOW]: { windowMs: 60000, maxRequests: 100, riskName: 'low-risk' },
  [RateLimitRiskLevel.MEDIUM]: { windowMs: 60000, maxRequests: 30, riskName: 'medium-risk' },
  [RateLimitRiskLevel.HIGH]: { windowMs: 60000, maxRequests: 10, riskName: 'high-risk' },
  [RateLimitRiskLevel.CRITICAL]: { windowMs: 120000, maxRequests: 5, riskName: 'critical-risk' },
};

/**
 * Advanced rate limiting middleware with risk assessment and enhanced security.
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  try {
    const key = config.keyGenerator ? config.keyGenerator(request) : getRequestKey(request);
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    const headers: Record<string, string> = {
      "X-RateLimit-Remaining": Math.max(0, config.maxRequests - record.count).toString(),
      "X-RateLimit-Reset": record.resetTime.toString(),
      "X-RateLimit-Limit": config.maxRequests.toString(),
    };

    if (config.standardHeaders === 'draft-6') {
      headers["RateLimit-Limit"] = config.maxRequests.toString();
      headers["RateLimit-Remaining"] = Math.max(0, config.maxRequests - record.count).toString();
      headers["RateLimit-Reset"] = Math.ceil(record.resetTime / 1000).toString();
    } else if (config.standardHeaders === 'draft-7') {
      headers["RateLimit-Limit"] = config.maxRequests.toString();
      headers["RateLimit-Remaining"] = Math.max(0, config.maxRequests - record.count).toString();
      headers["RateLimit-Reset"] = Math.ceil(record.resetTime / 1000).toString();
      headers["RateLimit-Duration"] = Math.ceil(config.windowMs / 1000).toString();
    }

    if (config.legacyHeaders) {
      headers["Retry-After"] = Math.ceil((record.resetTime - now) / 1000).toString();
    }

    if (record.count > config.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

      logger.warn("Rate limit exceeded", {
        action: "rate_limit_exceeded",
        ip: key,
        path: request.nextUrl?.pathname,
        method: request.method,
        count: record.count,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        retryAfter: retryAfterSeconds,
      });

      const errorMessage = config.message || `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`;

      if (config.errorResponse) {
        return config.errorResponse(request, {
          remaining: 0,
          resetTime: record.resetTime,
        });
      }

      return NextResponse.json(
        { error: "Too many requests", message: errorMessage },
        {
          status: 429,
          headers,
        }
      );
    }

    return null;
  } catch (error) {
    logger.error("Rate limiting error:", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Get client IP address from request with security considerations.
 */
function getRequestKey(request: NextRequest): string {
  const headers = request.headers;

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map(ip => ip.trim());
    if (ips.length > 0) return ips[0];
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  logger.warn("Unable to determine client IP address");
  return "unknown";
}

/**
 * Create a rate limiting middleware with predefined security configurations.
 */
export function createSecureRateLimitMiddleware(
  riskLevel: RateLimitRiskLevel = RateLimitRiskLevel.MEDIUM,
  _requestPath?: string
) {
  const config = RateLimitRiskConfigs[riskLevel];

  return async (request: NextRequest) => {
    return rateLimitMiddleware(request, config);
  };
}

/**
 * Super admin override for rate limiting.
 */
export async function superAdminRateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const config: RateLimitConfig = {
    windowMs: 60000,
    maxRequests: 1000,
    message: "Admin requests are highly privileged and have a higher rate limit.",
    standardHeaders: 'draft-7',
  };

  return rateLimitMiddleware(request, config);
}

/**
 * Clear rate limit store for cleanup.
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for monitoring.
 */
export function getRateLimitStatus(key: string): { count: number; resetTime: number; limit: number } | null {
  const record = rateLimitStore.get(key);
  if (!record) return null;

  return {
    count: record.count,
    resetTime: record.resetTime,
    limit: 30,
  };
}

/**
 * Express-style middleware adapter for use with Next.js.
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (request: NextRequest) => rateLimitMiddleware(request, config);
}

/**
 * Check API rate limit for client-side use.
 */
export async function checkApiRateLimit(
  key: string,
  _riskLevel?: string,
  options?: { windowMs?: number; maxRequests?: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter: number; headers: Record<string, string> }> {
  const now = Date.now();
  const windowMs = options?.windowMs || 60000;
  const maxRequests = options?.maxRequests || 100;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, record);
  } else {
    record.count++;
  }

  const retryAfter = Math.ceil((record.resetTime - now) / 1000);
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": Math.max(0, maxRequests - record.count).toString(),
    "X-RateLimit-Reset": record.resetTime.toString(),
    "X-RateLimit-Limit": maxRequests.toString(),
    "Retry-After": retryAfter.toString(),
  };

  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime,
    retryAfter,
    headers,
  };
}

/**
 * Check auth-specific rate limit (stricter limits for auth endpoints).
 */
export async function checkAuthRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter: number; headers: Record<string, string> }> {
  const now = Date.now();
  const windowMs = options?.windowMs || 60000;
  const maxRequests = options?.maxRequests || 10;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, record);
  } else {
    record.count++;
  }

  const retryAfter = Math.ceil((record.resetTime - now) / 1000);
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": Math.max(0, maxRequests - record.count).toString(),
    "X-RateLimit-Reset": record.resetTime.toString(),
    "X-RateLimit-Limit": maxRequests.toString(),
    "Retry-After": retryAfter.toString(),
  };

  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime,
    retryAfter,
    headers,
  };
}

/**
 * General rate limit check.
 */
export async function checkRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter: number; headers: Record<string, string> }> {
  return checkApiRateLimit(key, "medium", options);
}

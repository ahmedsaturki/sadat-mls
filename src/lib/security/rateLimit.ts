import "server-only";
/**
 * Rate limiting utilities for Sadat MLS Cloud.
 * Hybrid in-memory (L1) + PostgreSQL (L2) rate limiting.
 *
 * L1: In-memory Map for fast path (same instance, same window)
 * L2: PostgreSQL rate_limit_state table as source of truth (cross-instance)
 *
 * On each request:
 *   1. Check L1 — if valid entry exists, use it (fast path)
 *   2. On L1 miss/expiry, call increment_rate_limit() via RPC (atomic DB upsert)
 *   3. Update L1 with DB result
 *   4. Lazy cleanup of old rows (every 10 minutes)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

// ── L1 Cache ────────────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ── Lazy cleanup state ──────────────────────────────────────────────────
let lastCleanupTime = 0;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ROW_RETENTION_MS = 60 * 60 * 1000; // 1 hour — delete rows older than this

// ── Error class ─────────────────────────────────────────────────────────
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public remainingRequests?: number,
    public resetTime?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ── Config types ────────────────────────────────────────────────────────
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: "off" | "draft-6" | "draft-7";
  legacyHeaders?: boolean;
  errorResponse?: (
    request: NextRequest,
    context: { remaining: number; resetTime: number },
  ) => NextResponse;
}

export enum RateLimitRiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export const RateLimitRiskConfigs = {
  [RateLimitRiskLevel.LOW]: {
    windowMs: 60000,
    maxRequests: 100,
    riskName: "low-risk",
  },
  [RateLimitRiskLevel.MEDIUM]: {
    windowMs: 60000,
    maxRequests: 30,
    riskName: "medium-risk",
  },
  [RateLimitRiskLevel.HIGH]: {
    windowMs: 60000,
    maxRequests: 10,
    riskName: "high-risk",
  },
  [RateLimitRiskLevel.CRITICAL]: {
    windowMs: 120000,
    maxRequests: 5,
    riskName: "critical-risk",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Deterministic window start: all instances compute the same window for the same timestamp */
function calculateWindowStart(windowMs: number): Date {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  return new Date(windowStart);
}

/** Extract IP address from rate limit key (format: "action:ip") */
function extractIpFromKey(key: string): string {
  const lastColon = key.lastIndexOf(":");
  return lastColon > 0 ? key.substring(lastColon + 1) : key;
}

/** Extract action from rate limit key (format: "action:ip") */
function extractActionFromKey(key: string): string {
  const lastColon = key.lastIndexOf(":");
  return lastColon > 0 ? key.substring(0, lastColon) : key;
}

/** Build standard rate limit result object */
function buildResult(
  count: number,
  maxRequests: number,
  resetTimeMs: number,
  retryAfterSeconds: number,
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": Math.max(0, maxRequests - count).toString(),
    "X-RateLimit-Reset": resetTimeMs.toString(),
    "X-RateLimit-Limit": maxRequests.toString(),
    "Retry-After": retryAfterSeconds.toString(),
  };

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetTime: resetTimeMs,
    retryAfter: retryAfterSeconds,
    headers,
  };
}

// ── L2: Database operations ─────────────────────────────────────────────

/**
 * Atomically increment rate limit count in PostgreSQL via RPC.
 * Uses increment_rate_limit() function with ON CONFLICT DO UPDATE.
 * Returns the new count after increment.
 */
async function upsertRateLimitCount(
  action: string,
  ip: string,
  windowStart: Date,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_action: action,
    p_ip: ip,
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    logger.warn("Rate limit DB upsert failed", {
      action,
      ip,
      error: error.message,
    });
    throw error;
  }

  return data as number;
}

/** Lazy cleanup: delete rows older than ROW_RETENTION_MS, runs at most once per CLEANUP_INTERVAL_MS */
async function cleanupOldRateLimitState(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) return;
  lastCleanupTime = now;

  try {
    const supabase = createServiceRoleClient();
    const cutoff = new Date(now - ROW_RETENTION_MS);
    await supabase
      .from("rate_limit_state")
      .delete()
      .lt("window_start", cutoff.toISOString());
  } catch (error) {
    logger.warn("Rate limit cleanup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ── Core rate limit check (hybrid L1 + L2) ─────────────────────────────

async function hybridRateLimitCheck(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{
  count: number;
  resetTime: number;
  retryAfter: number;
}> {
  const now = Date.now();
  const windowStart = calculateWindowStart(windowMs);
  const resetTime = windowStart.getTime() + windowMs;

  // L1: In-memory fast path
  const record = rateLimitStore.get(key);
  if (record && now <= record.resetTime) {
    // Same window — increment locally (fast path, no DB hit)
    record.count++;
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { count: record.count, resetTime: record.resetTime, retryAfter };
  }

  // L2: DB source of truth (new window or different instance)
  try {
    const action = extractActionFromKey(key);
    const ip = extractIpFromKey(key);
    const count = await upsertRateLimitCount(action, ip, windowStart);

    // Update L1 cache
    rateLimitStore.set(key, { count, resetTime });

    const retryAfter = Math.ceil((resetTime - now) / 1000);

    // Lazy cleanup (runs at most once per 10 min)
    cleanupOldRateLimitState();

    return { count, resetTime, retryAfter };
  } catch (error) {
    // DB failure: fall back to in-memory only (same as pre-DB behavior)
    logger.error("Rate limit DB check failed, using in-memory fallback", {
      error: error instanceof Error ? error.message : String(error),
    });

    let fallbackRecord = rateLimitStore.get(key);
    if (!fallbackRecord || now > fallbackRecord.resetTime) {
      fallbackRecord = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, fallbackRecord);
    } else {
      fallbackRecord.count++;
    }

    const retryAfter = Math.ceil((fallbackRecord.resetTime - now) / 1000);
    return {
      count: fallbackRecord.count,
      resetTime: fallbackRecord.resetTime,
      retryAfter,
    };
  }
}

// ── IP extraction from request ──────────────────────────────────────────

function getRequestKey(request: NextRequest): string {
  const headers = request.headers;

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0) return ips[0];
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  logger.warn("Unable to determine client IP address");
  return "unknown";
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Rate limiting middleware with risk assessment and enhanced security.
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  try {
    const key = config.keyGenerator
      ? config.keyGenerator(request)
      : getRequestKey(request);
    const { count, resetTime, retryAfter } = await hybridRateLimitCheck(
      key,
      config.windowMs,
      config.maxRequests,
    );

    const headers: Record<string, string> = {
      "X-RateLimit-Remaining": Math.max(0, config.maxRequests - count).toString(),
      "X-RateLimit-Reset": resetTime.toString(),
      "X-RateLimit-Limit": config.maxRequests.toString(),
    };

    if (config.standardHeaders === "draft-6") {
      headers["RateLimit-Limit"] = config.maxRequests.toString();
      headers["RateLimit-Remaining"] = Math.max(0, config.maxRequests - count).toString();
      headers["RateLimit-Reset"] = Math.ceil(resetTime / 1000).toString();
    } else if (config.standardHeaders === "draft-7") {
      headers["RateLimit-Limit"] = config.maxRequests.toString();
      headers["RateLimit-Remaining"] = Math.max(0, config.maxRequests - count).toString();
      headers["RateLimit-Reset"] = Math.ceil(resetTime / 1000).toString();
      headers["RateLimit-Duration"] = Math.ceil(config.windowMs / 1000).toString();
    }

    if (config.legacyHeaders) {
      headers["Retry-After"] = retryAfter.toString();
    }

    if (count > config.maxRequests) {
      logger.warn("Rate limit exceeded", {
        action: "rate_limit_exceeded",
        ip: key,
        path: request.nextUrl?.pathname,
        method: request.method,
        count,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        retryAfter,
      });

      const errorMessage =
        config.message ||
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`;

      if (config.errorResponse) {
        return config.errorResponse(request, { remaining: 0, resetTime });
      }

      return NextResponse.json(
        {
          error: "Too many requests",
          message: errorMessage,
          i18nKey: "rateLimited",
          i18nParams: { seconds: retryAfter },
        },
        { status: 429, headers },
      );
    }

    return null;
  } catch (error) {
    logger.error("Rate limiting error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create a rate limiting middleware with predefined security configurations.
 */
export function createSecureRateLimitMiddleware(
  riskLevel: RateLimitRiskLevel = RateLimitRiskLevel.MEDIUM,
) {
  const config = RateLimitRiskConfigs[riskLevel];
  return async (request: NextRequest) => {
    return rateLimitMiddleware(request, config);
  };
}

/**
 * Super admin override for rate limiting.
 */
export async function superAdminRateLimitMiddleware(
  request: NextRequest,
): Promise<NextResponse | null> {
  const config: RateLimitConfig = {
    windowMs: 60000,
    maxRequests: 1000,
    message: "Admin requests are highly privileged and have a higher rate limit.",
    standardHeaders: "draft-7",
  };
  return rateLimitMiddleware(request, config);
}

/**
 * Clear in-memory rate limit store (for testing).
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for monitoring.
 */
export function getRateLimitStatus(
  key: string,
  limit?: number,
): { count: number; resetTime: number; limit: number } | null {
  const record = rateLimitStore.get(key);
  if (!record) return null;
  return {
    count: record.count,
    resetTime: record.resetTime,
    limit: limit ?? 30,
  };
}

/**
 * Express-style middleware adapter for use with Next.js.
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (request: NextRequest) => rateLimitMiddleware(request, config);
}

/**
 * Check API rate limit (used by API routes).
 */
export async function checkApiRateLimit(
  key: string,
  _riskLevel?: string,
  options?: { windowMs?: number; maxRequests?: number },
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
  headers: Record<string, string>;
}> {
  const windowMs = options?.windowMs || 60000;
  const maxRequests = options?.maxRequests || 100;
  const { count, resetTime, retryAfter } = await hybridRateLimitCheck(
    key,
    windowMs,
    maxRequests,
  );
  return buildResult(count, maxRequests, resetTime, retryAfter);
}

/**
 * Check auth-specific rate limit (stricter limits for auth endpoints).
 */
export async function checkAuthRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number },
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
  headers: Record<string, string>;
}> {
  const windowMs = options?.windowMs || 60000;
  const maxRequests = options?.maxRequests || 10;
  const { count, resetTime, retryAfter } = await hybridRateLimitCheck(
    key,
    windowMs,
    maxRequests,
  );
  return buildResult(count, maxRequests, resetTime, retryAfter);
}

/**
 * General rate limit check.
 */
export async function checkRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number },
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
  headers: Record<string, string>;
}> {
  return checkApiRateLimit(key, "medium", options);
}

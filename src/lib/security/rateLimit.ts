import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

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
  [RateLimitRiskLevel.LOW]: { windowMs: 60000, maxRequests: 100, riskName: "low-risk" },
  [RateLimitRiskLevel.MEDIUM]: { windowMs: 60000, maxRequests: 30, riskName: "medium-risk" },
  [RateLimitRiskLevel.HIGH]: { windowMs: 60000, maxRequests: 10, riskName: "high-risk" },
  [RateLimitRiskLevel.CRITICAL]: { windowMs: 120000, maxRequests: 5, riskName: "critical-risk" },
};

function calculateWindowStart(windowMs: number): Date {
  return new Date(Math.floor(Date.now() / windowMs) * windowMs);
}

function extractIpFromKey(key: string): string {
  const lastColon = key.lastIndexOf(":");
  return lastColon > 0 ? key.slice(lastColon + 1) : key;
}

function extractActionFromKey(key: string): string {
  const lastColon = key.lastIndexOf(":");
  return lastColon > 0 ? key.slice(0, lastColon) : key;
}

function sanitizeIpForInet(ip: string): string {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  const ipv6Mapped = /^::(ffff:)?(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4.test(ip) || ipv6.test(ip) || ipv6Mapped.test(ip) ? ip : "0.0.0.0";
}

function buildResult(count: number, maxRequests: number, resetTime: number, retryAfter: number) {
  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetTime,
    retryAfter,
    headers: {
      "X-RateLimit-Remaining": Math.max(0, maxRequests - count).toString(),
      "X-RateLimit-Reset": resetTime.toString(),
      "X-RateLimit-Limit": maxRequests.toString(),
      "Retry-After": retryAfter.toString(),
    },
  };
}

async function incrementRateLimit(action: string, ip: string, windowStart: Date): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("increment_security_rate_limit", {
    p_action: action,
    p_ip: sanitizeIpForInet(ip),
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    logger.error("Rate limit database check failed", { action, error: error.message });
    throw error;
  }

  if (typeof data !== "number") throw new Error("Rate limit database returned an invalid count");
  return data;
}

async function cleanupOldRateLimitState(): Promise<void> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const { error } = await supabase
    .from("security_rate_limits")
    .delete()
    .lt("window_start", cutoff.toISOString());
  if (error) {
    logger.warn("Rate limit cleanup failed", { error: error.message });
  }
}

async function databaseRateLimitCheck(key: string, windowMs: number, maxRequests: number) {
  const now = Date.now();
  const windowStart = calculateWindowStart(windowMs);
  const resetTime = windowStart.getTime() + windowMs;
  const count = await incrementRateLimit(
    extractActionFromKey(key),
    extractIpFromKey(key),
    windowStart,
  );

  if (Math.random() < 0.01) void cleanupOldRateLimitState();
  return { count, resetTime, retryAfter: Math.max(1, Math.ceil((resetTime - now) / 1000)) };
}

function getRequestKey(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real;

  logger.warn("Unable to determine client IP address");
  return "unknown";
}

export async function rateLimitMiddleware(request: NextRequest, config: RateLimitConfig): Promise<NextResponse | null> {
  try {
    const key = config.keyGenerator ? config.keyGenerator(request) : getRequestKey(request);
    const { count, resetTime, retryAfter } = await databaseRateLimitCheck(key, config.windowMs, config.maxRequests);
    const headers: Record<string, string> = {
      "X-RateLimit-Remaining": Math.max(0, config.maxRequests - count).toString(),
      "X-RateLimit-Reset": resetTime.toString(),
      "X-RateLimit-Limit": config.maxRequests.toString(),
    };

    if (config.standardHeaders === "draft-6" || config.standardHeaders === "draft-7") {
      headers["RateLimit-Limit"] = config.maxRequests.toString();
      headers["RateLimit-Remaining"] = Math.max(0, config.maxRequests - count).toString();
      headers["RateLimit-Reset"] = Math.ceil(resetTime / 1000).toString();
    }
    if (config.standardHeaders === "draft-7") {
      headers["RateLimit-Duration"] = Math.ceil(config.windowMs / 1000).toString();
    }
    if (config.legacyHeaders) headers["Retry-After"] = retryAfter.toString();

    if (count > config.maxRequests) {
      if (config.errorResponse) return config.errorResponse(request, { remaining: 0, resetTime });
      return NextResponse.json(
        {
          error: "Too many requests",
          message: config.message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          i18nKey: "rateLimited",
          i18nParams: { seconds: retryAfter },
        },
        { status: 429, headers },
      );
    }
    return null;
  } catch (error) {
    logger.error("Rate limiting unavailable; failing closed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable" },
      { status: 503, headers: { "Retry-After": "30" } },
    );
  }
}

export function createSecureRateLimitMiddleware(riskLevel: RateLimitRiskLevel = RateLimitRiskLevel.MEDIUM) {
  return (request: NextRequest) => rateLimitMiddleware(request, RateLimitRiskConfigs[riskLevel]);
}

export async function superAdminRateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  return rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 1000,
    message: "Admin requests are highly privileged and have a higher rate limit.",
    standardHeaders: "draft-7",
  });
}

export function clearRateLimitStore(): void {
  // Retained for API/test compatibility; rate-limit decisions are DB-authoritative.
}

export function getRateLimitStatus(_key: string, _limit = 30): null {
  return null;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (request: NextRequest) => rateLimitMiddleware(request, config);
}

export async function checkApiRateLimit(
  key: string,
  _riskLevel?: string,
  options?: { windowMs?: number; maxRequests?: number },
) {
  const windowMs = options?.windowMs || 60000;
  const maxRequests = options?.maxRequests || 100;
  try {
    const { count, resetTime, retryAfter } = await databaseRateLimitCheck(key, windowMs, maxRequests);
    return { ...buildResult(count, maxRequests, resetTime, retryAfter), unavailable: false };
  } catch (error) {
    logger.error("API rate limit unavailable; failing closed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ...buildResult(maxRequests + 1, maxRequests, Date.now() + 30000, 30), unavailable: true };
  }
}

export async function checkAuthRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number },
) {
  return checkApiRateLimit(key, undefined, {
    windowMs: options?.windowMs || 60000,
    maxRequests: options?.maxRequests || 10,
  });
}

export async function checkRateLimit(key: string, options?: { windowMs?: number; maxRequests?: number }) {
  return checkApiRateLimit(key, "medium", options);
}

import "server-only";

import { logger } from "@/lib/logger";
import { createPublicApiClient } from "@/lib/supabase/public-api";

export const PUBLIC_RATE_LIMIT_ACTIONS = [
  "login",
  "forgot",
  "resend",
  "csrf-token",
  "csp-report",
  "contact-post",
] as const;

export type PublicRateLimitAction = (typeof PUBLIC_RATE_LIMIT_ACTIONS)[number];

const PUBLIC_RATE_LIMITS: Record<
  PublicRateLimitAction,
  { windowMs: number; maxRequests: number }
> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  forgot: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  resend: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  "csrf-token": { windowMs: 60 * 1000, maxRequests: 100 },
  "csp-report": { windowMs: 60 * 1000, maxRequests: 100 },
  "contact-post": { windowMs: 60 * 60 * 1000, maxRequests: 5 },
};

export function isPublicRateLimitAction(action: string): action is PublicRateLimitAction {
  return Object.prototype.hasOwnProperty.call(PUBLIC_RATE_LIMITS, action);
}

export async function checkPublicRateLimit(
  action: PublicRateLimitAction,
  clientIp: string,
) {
  const config = PUBLIC_RATE_LIMITS[action];

  try {
    const supabase = createPublicApiClient();
    const { data, error } = await supabase.rpc("increment_public_rate_limit", {
      p_action: action,
      p_client_ip: clientIp,
    });

    if (error) throw error;
    if (!data || typeof data !== "object") {
      throw new Error("Public rate-limit RPC returned an invalid response");
    }

    const result = data as {
      allowed?: boolean;
      remaining?: number;
      retryAfter?: number;
      resetAt?: number;
    };

    if (
      typeof result.allowed !== "boolean" ||
      typeof result.remaining !== "number" ||
      typeof result.retryAfter !== "number" ||
      typeof result.resetAt !== "number"
    ) {
      throw new Error("Public rate-limit RPC returned an invalid response");
    }

    const remaining = Math.max(
      0,
      Math.min(config.maxRequests, Math.trunc(result.remaining)),
    );
    const retryAfter = Math.max(1, Math.ceil(result.retryAfter));
    const resetTime = Math.round(result.resetAt * 1000);

    return {
      allowed: result.allowed,
      remaining,
      resetTime,
      retryAfter,
      unavailable: false,
      headers: {
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetTime),
        "X-RateLimit-Limit": String(config.maxRequests),
        "Retry-After": String(retryAfter),
      },
    };
  } catch (error) {
    logger.error("Public rate limiting unavailable; failing closed", {
      action,
      error: error instanceof Error ? error.message : String(error),
    });

    const resetTime = Date.now() + 30_000;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter: 30,
      unavailable: true,
      headers: {
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetTime),
        "X-RateLimit-Limit": String(config.maxRequests),
        "Retry-After": "30",
      },
    };
  }
}

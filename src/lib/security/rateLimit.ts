import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Maximum number of entries in the in-memory rate-limit map. */
const MAX_MAP_SIZE = 10_000;

/** How often (ms) to sweep stale entries from the in-memory map. */
const CLEANUP_INTERVAL_MS = 60 * 1000;

/* -------------------------------------------------------------------------- */
/*  Cleanup timer — sweeps expired entries every 60 s                          */
/* -------------------------------------------------------------------------- */

function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug(`Rate-limit cleanup: removed ${cleaned} expired entries`);
  }
}

// Run once immediately, then on an interval.
cleanupExpiredEntries();
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

/* -------------------------------------------------------------------------- */
/*  IP extraction                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Extract the IP address from a rate-limit key.
 *
 * Keys follow the format `"prefix:ip"` where `ip` may itself contain colons
 * (IPv6).  We therefore split on the *last* colon and return everything after
 * it.  If no colon is found the whole key is returned as-is (fallback).
 */
function extractIp(key: string): string {
  const lastColon = key.lastIndexOf(":");
  if (lastColon === -1) return key;
  const ip = key.slice(lastColon + 1);
  return ip || "unknown";
}

/* -------------------------------------------------------------------------- */
/*  Database-backed rate limiting                                             */
/* -------------------------------------------------------------------------- */

async function checkRateLimitDb(
  key: string,
  action: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const ip = extractIp(key);
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  try {
    const supabase = await createClient();

    const { count, error: countError } = await supabase
      .from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("ip_address", ip)
      .gte("created_at", windowStart);

    if (countError) {
      logger.warn("Rate limit DB count failed, falling back to memory", { error: countError.message });
      return checkRateLimitMemory(key, config);
    }

    if ((count || 0) >= config.maxRequests) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil(config.windowMs / 1000) };
    }

    const { error: insertError } = await supabase.from("rate_limit_log").insert({
      action,
      ip_address: ip,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      logger.warn("Rate limit DB insert failed", { error: insertError.message });
    }

    return { allowed: true, remaining: config.maxRequests - (count || 0) - 1, retryAfter: 0 };
  } catch (err) {
    logger.warn("Rate limit DB check failed, falling back to memory", { error: String(err) });
    return checkRateLimitMemory(key, config);
  }
}

/* -------------------------------------------------------------------------- */
/*  In-memory fallback rate limiting                                          */
/* -------------------------------------------------------------------------- */

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Enforce max-size to prevent memory exhaustion.
    if (rateLimitMap.size >= MAX_MAP_SIZE) {
      cleanupExpiredEntries();
      // If still full after cleanup, evict the oldest 10 % of entries.
      if (rateLimitMap.size >= MAX_MAP_SIZE) {
        evictOldest(Math.ceil(MAX_MAP_SIZE * 0.1));
      }
    }
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, retryAfter: 0 };
}

/**
 * Evict the oldest `n` entries (by `resetTime`) to free memory when the map
 * has hit its capacity ceiling.
 */
function evictOldest(n: number): void {
  let evicted = 0;
  // Sort keys by resetTime ascending so the oldest entries come first.
  const entries = [...rateLimitMap.entries()].sort(
    ([, a], [, b]) => a.resetTime - b.resetTime,
  );
  for (const [key] of entries) {
    if (evicted >= n) break;
    rateLimitMap.delete(key);
    evicted++;
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export async function checkRateLimit(
  key: string,
  action: string,
  config: Partial<RateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  return checkRateLimitDb(key, action, mergedConfig);
}

const apiRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 20,
};

export async function checkApiRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  return checkRateLimit(`api:${key}`, "api", apiRateLimitConfig);
}

const authRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

export async function checkAuthRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  return checkRateLimit(`auth:${key}`, "auth", authRateLimitConfig);
}

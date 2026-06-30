import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Maximum number of entries in the in-memory rate-limit map. */
const MAX_MAP_SIZE = 10_000;

/** How often (ms) to sweep stale entries from the in-memory map. */
const CLEANUP_INTERVAL_MS = 60 * 1000;

/* -------------------------------------------------------------------------- */
/*  Supabase Client Connection Pooling (Service Role for RLS bypass)          */
/* -------------------------------------------------------------------------- */

let supabaseClient: ReturnType<typeof createServiceRoleClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createServiceRoleClient> {
  if (!supabaseClient) {
    supabaseClient = createServiceRoleClient();
  }
  return supabaseClient;
}

/* -------------------------------------------------------------------------- */
/*  Cleanup timer — sweeps expired entries every 60 s                          */
/* -------------------------------------------------------------------------- */

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

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
// Guard against multiple initializations in hot-reload or serverless.
cleanupExpiredEntries();
if (typeof setInterval !== "undefined" && cleanupTimer === null) {
  cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
  // Prevent the timer from keeping the process alive in serverless
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  headers?: Record<string, string>;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

/* -------------------------------------------------------------------------- */
/*  IP extraction and validation                                               */
/* -------------------------------------------------------------------------- */

/**
 * Validate whether a string is a plausible IPv4 or IPv6 address.
 * Rejects bare numbers like "1", "0", "unknown", empty strings, etc.
 * Used to sanitize IPs before PostgreSQL `inet` column insertion.
 */
function isValidIp(value: string): boolean {
  if (!value || value === "unknown") return false;

  // IPv4: four dot-separated decimal groups (0-255)
  const ipv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv4.test(value)) {
    return value.split(".").every((octet) => {
      const n = Number(octet);
      return n >= 0 && n <= 255;
    });
  }

  // IPv6: at least one colon, hex groups (simplified but covers real-world cases)
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F]{0,4}$/;
  if (ipv6.test(value)) return true;

  // IPv6 mapped/compatible forms (e.g. ::ffff:192.168.1.1)
  const ipv6Mapped = /^::ffff:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv6Mapped.test(value)) return true;

  // Loopback, unspecified, etc. — only match actual IPv6 special addresses
  const ipv6Special = /^(::1|::)$/;
  if (ipv6Special.test(value)) return true;

  return false;
}

/**
 * Extract the IP address from a rate-limit key.
 *
 * Keys follow the format `"prefix:ip"` where `ip` may itself contain colons
 * (IPv6).  We therefore split on the *last* colon and return everything after
 * it.  If no colon is found the whole key is returned as-is (fallback).
 *
 * Returns "unknown" if the extracted value is not a valid IP address.
 */
function extractIp(key: string): string {
  const lastColon = key.lastIndexOf(":");
  if (lastColon === -1) return isValidIp(key) ? key : "unknown";
  const ip = key.slice(lastColon + 1);
  if (!ip) return "unknown";
  return isValidIp(ip) ? ip : "unknown";
}

/**
 * Validate and sanitize rate limit configuration.
 * Prevents edge cases like zero or negative values.
 */
function validateConfig(config: RateLimitConfig): RateLimitConfig {
  return {
    windowMs: Math.max(1000, config.windowMs), // Minimum 1 second
    maxRequests: Math.max(1, config.maxRequests), // Minimum 1 request
  };
}

/* -------------------------------------------------------------------------- */
/*  LRU Cache for efficient eviction                                          */
/* -------------------------------------------------------------------------- */

interface LRUCacheEntry<K, V> {
  key: K;
  value: V;
  timestamp: number;
}

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, LRUCacheEntry<K, V>>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    entry.timestamp = Date.now();
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.timestamp = Date.now();
      entry.value = value;
      return;
    }

    if (this.cache.size >= this.capacity) {
      // Remove oldest entry
      let oldestKey: K | undefined;
      let oldestTime = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { key, value, timestamp: Date.now() });
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Use LRU cache for IP extraction results
const ipCache = new LRUCache<string, string>(1000);

/**
 * Extract IP with LRU caching to avoid repeated string parsing
 */
function extractIpCached(key: string): string {
  const cached = ipCache.get(key);
  if (cached) return cached;

  const ip = extractIp(key);
  ipCache.set(key, ip);
  return ip;
}

/* -------------------------------------------------------------------------- */
/*  Database-backed rate limiting                                             */
/* -------------------------------------------------------------------------- */

async function checkRateLimitDb(
  key: string,
  action: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  // L1 Cache (Memory) Check FIRST to protect database from DOS
  const memResult = checkRateLimitMemory(key, config, false); // false = don't increment yet
  if (!memResult.allowed) {
    return { ...memResult, headers: buildRateLimitHeaders(memResult, config) };
  }

  const ip = extractIpCached(key);

  // When IP is unknown (server-side, cron, ISR) we cannot write to the
  // inet column — fall back to memory-only rate limiting to avoid
  // "invalid input syntax for type inet" PostgreSQL errors.
  if (ip === "unknown") {
    const result = checkRateLimitMemory(key, config, true);
    return { ...result, headers: buildRateLimitHeaders(result, config) };
  }

  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  try {
    const supabase = getSupabaseClient();

    const { count, error: countError } = await supabase
      .from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("ip_address", ip)
      .gte("created_at", windowStart);

    if (countError) {
      logger.warn("Rate limit DB count failed, falling back to memory", { error: countError.message });
      const result = checkRateLimitMemory(key, config, true);
      return { ...result, headers: buildRateLimitHeaders(result, config) };
    }

    if ((count || 0) >= config.maxRequests) {
      // Sync memory block to avoid hitting DB again
      const record = rateLimitMap.get(key);
      if (record) {
        record.count = config.maxRequests;
      }
      const result = { allowed: false, remaining: 0, retryAfter: Math.ceil(config.windowMs / 1000) };
      return { ...result, headers: buildRateLimitHeaders(result, config) };
    }

    const { error: insertError } = await supabase.from("rate_limit_log").insert({
      action,
      ip_address: ip,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      logger.warn("Rate limit DB insert failed", { error: insertError.message });
    }

    // Increment memory cache for L1
    const result = checkRateLimitMemory(key, config, true);
    return { ...result, headers: buildRateLimitHeaders(result, config) };
  } catch (err) {
    logger.warn("Rate limit DB check failed, falling back to memory", { error: String(err) });
    const result = checkRateLimitMemory(key, config, true);
    return { ...result, headers: buildRateLimitHeaders(result, config) };
  }
}

/* -------------------------------------------------------------------------- */
/*  In-memory fallback rate limiting                                          */
/* -------------------------------------------------------------------------- */

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
  increment: boolean = true
): Omit<RateLimitResult, "headers"> {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Memory guard: if map is full, cleanup first
    if (rateLimitMap.size >= MAX_MAP_SIZE) {
      cleanupExpiredEntries();
      // If still full after cleanup, evict oldest entries
      if (rateLimitMap.size >= MAX_MAP_SIZE) {
        evictOldestLRU(Math.ceil(MAX_MAP_SIZE * 0.1));
      }
    }
    record = { count: 0, resetTime: now + config.windowMs };
    rateLimitMap.set(key, record);
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  if (increment) {
    record.count++;
  }
  return { allowed: true, remaining: config.maxRequests - record.count, retryAfter: 0 };
}

/**
 * Build standard rate limiting headers
 */
function buildRateLimitHeaders(
  result: { allowed: boolean; remaining: number; retryAfter: number },
  config: RateLimitConfig
): Record<string, string> {
  const resetTime = Math.floor(Date.now() / 1000) + Math.ceil(config.windowMs / 1000);
  return {
    "Retry-After": String(result.retryAfter || Math.ceil(config.windowMs / 1000)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Reset": String(resetTime),
  };
}

/**
 * Evict the oldest `n` entries using LRU strategy (by timestamp) to free memory
 * when the map has hit its capacity ceiling.
 */
function evictOldestLRU(n: number): void {
  let evicted = 0;
  // Collect entries and sort by resetTime to find the oldest entries efficiently
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
): Promise<RateLimitResult> {
  const mergedConfig = validateConfig({ ...DEFAULT_CONFIG, ...config });
  return checkRateLimitDb(key, action, mergedConfig);
}

const apiRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 20,
};

export async function checkApiRateLimit(key: string): Promise<RateLimitResult> {
  return checkRateLimit(`api:${key}`, "api", apiRateLimitConfig);
}

const authRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

export async function checkAuthRateLimit(key: string): Promise<RateLimitResult> {
  return checkRateLimit(`auth:${key}`, "auth", authRateLimitConfig);
}
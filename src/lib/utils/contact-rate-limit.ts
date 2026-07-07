import { logger } from "@/lib/logger";

interface ContactRateLimitConfig {
  storageKey: string;
  maxAttempts: number;
  lockoutMs: number;
}

interface ContactAttempts {
  count: number;
  firstAttemptAt: number;
}

const DEFAULT_CONFIG: ContactRateLimitConfig = {
  storageKey: "sadat_contact_attempts",
  maxAttempts: 3,
  lockoutMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Get current contact attempt count and first attempt timestamp.
 * Returns zeros if no data or lockout expired.
 */
export function getContactAttempts(
  config: Partial<ContactRateLimitConfig> = {}
): { count: number; firstAttemptAt: number } {
  const { storageKey, lockoutMs } = { ...DEFAULT_CONFIG, ...config };

  if (typeof window === "undefined") return { count: 0, firstAttemptAt: 0 };
  try {
    const data = localStorage.getItem(storageKey);
    if (!data) return { count: 0, firstAttemptAt: 0 };
    const parsed: ContactAttempts = JSON.parse(data);
    if (Date.now() - parsed.firstAttemptAt > lockoutMs) {
      localStorage.removeItem(storageKey);
      return { count: 0, firstAttemptAt: 0 };
    }
    return parsed;
  } catch (err) {
    logger.error("Failed to parse contact rate limit data", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { count: 0, firstAttemptAt: 0 };
  }
}

/**
 * Record a new contact attempt. Returns updated count and whether user is locked out.
 */
export function recordContactAttempt(
  config: Partial<ContactRateLimitConfig> = {}
): { count: number; locked: boolean } {
  const { storageKey, maxAttempts } = { ...DEFAULT_CONFIG, ...config };
  const current = getContactAttempts(config);
  const newCount = current.count + 1;
  const firstAttemptAt = current.count === 0 ? Date.now() : current.firstAttemptAt;
  localStorage.setItem(
    storageKey,
    JSON.stringify({ count: newCount, firstAttemptAt })
  );
  return { count: newCount, locked: newCount >= maxAttempts };
}

/**
 * Clear stored contact attempts (e.g. after successful submission).
 */
export function clearContactAttempts(
  config: Partial<ContactRateLimitConfig> = {}
): void {
  const { storageKey } = { ...DEFAULT_CONFIG, ...config };
  localStorage.removeItem(storageKey);
}

/**
 * Helper to get remaining minutes until lockout expires.
 * Returns 0 if not locked out.
 */
export function getLockoutMinutesRemaining(
  config: Partial<ContactRateLimitConfig> = {}
): number {
  const { lockoutMs } = { ...DEFAULT_CONFIG, ...config };
  const { count, firstAttemptAt } = getContactAttempts(config);
  if (count === 0) return 0;
  const elapsed = Date.now() - firstAttemptAt;
  if (elapsed >= lockoutMs) return 0;
  return Math.ceil((lockoutMs - elapsed) / 60000);
}

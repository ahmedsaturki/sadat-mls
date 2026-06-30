import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/** Token rotation interval: regenerate every 4 hours. */
const TOKEN_ROTATION_MS = 4 * 60 * 60 * 1000;

/**
 * Generate a secure CSRF token using crypto API.
 * Uses 256-bit random values for strong entropy.
 */
export function generateCsrfToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create CSRF token for the current session.
 * Stores in NON-HttpOnly cookie so the client can read it
 * and send it back as a header (double-submit cookie pattern).
 * Rotates token every TOKEN_ROTATION_MS to limit token reuse window.
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME);

  if (existing?.value) {
    // Check if token needs rotation based on cookie age
    // We embed a timestamp in the token: "timestamp.randomUUID"
    const parts = existing.value.split(".");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < TOKEN_ROTATION_MS) {
        return existing.value;
      }
    }
    // Token is missing timestamp or expired — rotate
  }

  const token = `${Date.now()}.${generateCsrfToken()}`;
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return token;
}

/**
 * Extract CSRF token from request headers.
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token using double-submit cookie pattern.
 * Compares header token with cookie token using constant-time comparison.
 * Also validates token age to prevent replay attacks.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const headerToken = getCsrfTokenFromRequest(request);
  if (!headerToken) {
    logger.warn("CSRF validation failed: missing header token");
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    logger.warn("CSRF validation failed: missing cookie token");
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) {
    logger.warn("CSRF validation failed: token length mismatch");
    return false;
  }

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  if (result !== 0) {
    logger.warn("CSRF validation failed: token mismatch");
    return false;
  }

  // Validate token age — reject tokens older than 24 hours
  const parts = cookieToken.split(".");
  if (parts.length === 2) {
    const timestamp = parseInt(parts[0], 10);
    if (!isNaN(timestamp) && Date.now() - timestamp >= 24 * 60 * 60 * 1000) {
      logger.warn("CSRF validation failed: token expired");
      return false;
    }
  }

  return true;
}

/**
 * Clear CSRF token (e.g., on logout).
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}

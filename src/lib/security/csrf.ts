import "server-only";
/**
 * Server-only CSRF token validation and protection utilities.
 * Uses double-submit cookie pattern with constant-time comparison.
 *
 * IMPORTANT: This module imports "next/headers" which is server-only.
 * Client code must import shared constants from csrf-constants.ts instead.
 */
import { cookies } from "next/headers";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, TOKEN_MAX_AGE_MS, generateCsrfToken } from "@/lib/security/csrf-constants";
import { logger } from "@/lib/logger";

// Re-export shared constants so server-only consumers can import from this module
export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, generateCsrfToken };

/** Get existing token from cookie or generate a new one */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existing) {
    const parts = existing.split(".");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < TOKEN_MAX_AGE_MS) {
        return existing;
      }
    }
  }

  const token = generateCsrfToken();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return token;
}

/** Extract CSRF token from request headers */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/** Validate CSRF token using constant-time comparison */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) {
      return false;
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!cookieToken) {
      return false;
    }

    // Constant-time comparison (always compare full length to prevent timing leaks)
    const maxLen = Math.max(headerToken.length, cookieToken.length);
    let result = 0;
    for (let i = 0; i < maxLen; i++) {
      const a = i < headerToken.length ? headerToken.charCodeAt(i) : 0;
      const b = i < cookieToken.length ? cookieToken.charCodeAt(i) : 0;
      result |= a ^ b;
    }

    if (result !== 0) {
      return false;
    }

    // Validate token age (24 hours)
    const parts = cookieToken.split(".");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp >= TOKEN_MAX_AGE_MS) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error("CSRF validation error:", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/** Clear CSRF token from cookie */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}

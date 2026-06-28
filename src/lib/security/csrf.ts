import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a secure CSRF token.
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
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }

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
 * Compares header token with cookie token.
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

  return true;
}

/**
 * Clear CSRF token (e.g., on logout).
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}

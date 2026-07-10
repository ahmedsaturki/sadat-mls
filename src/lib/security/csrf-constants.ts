/**
 * Shared CSRF constants — safe for both server and client imports.
 */

/** Cookie name for CSRF token */
export const CSRF_COOKIE_NAME = "csrf_token";

/** Header name for CSRF token */
export const CSRF_HEADER_NAME = "x-csrf-token";

/** Token validity duration (24 hours) */
export const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Generate a cryptographically secure CSRF token with timestamp prefix */
export function generateCsrfToken(): string {
  const timestamp = Date.now();
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${timestamp}.${randomPart}`;
}

/** Check if a CSRF token is still within its validity window */
export function isCsrfTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < TOKEN_MAX_AGE_MS) {
        return true;
      }
    }
  } catch {
    // If parsing fails, token is invalid
  }
  return false;
}

"use client";

/**
 * Get CSRF token from cookie on client side
 */
export function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get headers with CSRF token for fetch requests
 */
export function getCsrfHeaders(): HeadersInit {
  const token = getCsrfToken();
  return token ? { "x-csrf-token": token } : {};
}
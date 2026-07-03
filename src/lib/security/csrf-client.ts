/**
 * Client-side CSRF utilities for Sadat MLS Cloud.
 * Handles token fetching, caching, and request enhancement.
 */
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import { logger } from "@/lib/logger";

/** Get CSRF headers for API requests */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCookieValue();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

/** Get CSRF token from cookie */
export function getCsrfToken(): string | null {
  return getCookieValue();
}

function getCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

export interface CSRFClientConfig {
  enableAutoTokenFetch?: boolean;
  tokenRefreshInterval?: number;
}

export class CSRFClient {
  private static instance: CSRFClient;
  private config: CSRFClientConfig;
  private cachedToken: string | null = null;
  private tokenFetchPromise: Promise<string> | null = null;

  constructor(config: CSRFClientConfig = {}) {
    this.config = {
      enableAutoTokenFetch: true,
      tokenRefreshInterval: 5 * 60 * 1000, // 5 minutes
      ...config,
    };
  }

  static getInstance(config?: CSRFClientConfig): CSRFClient {
    if (!CSRFClient.instance) {
      CSRFClient.instance = new CSRFClient(config);
    }
    return CSRFClient.instance;
  }

  async getToken(): Promise<string> {
    if (this.cachedToken) {
      return this.cachedToken;
    }

    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }

    this.tokenFetchPromise = this.fetchTokenFromServer();
    try {
      this.cachedToken = await this.tokenFetchPromise;
      return this.cachedToken;
    } finally {
      this.tokenFetchPromise = null;
    }
  }

  private async fetchTokenFromServer(): Promise<string> {
    try {
      const response = await fetch("/api/auth/csrf-token", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        logger.error("Failed to fetch CSRF token:", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      logger.debug("CSRF token fetched successfully");
      return data.token;
    } catch (error) {
      logger.error("Error fetching CSRF token:", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const cookieToken = getCookieValue();
      if (!cookieToken) {
        logger.warn("CSRF validation failed: no cookie token");
        return false;
      }

      if (token.length !== cookieToken.length) {
        logger.warn("CSRF validation failed: token length mismatch");
        return false;
      }

      // Constant-time comparison
      let result = 0;
      for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
      }

      const isValid = result === 0;
      if (!isValid) {
        logger.warn("CSRF validation failed: token mismatch", { token: token.substring(0, 8) + "..." });
      }
      return isValid;
    } catch (error) {
      logger.error("CSRF validation error:", { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  async enhanceRequest(request: Request, customToken?: string): Promise<Request> {
    const token = customToken || (await this.getToken());
    const url = new URL(request.url);

    const enhancedRequest = new Request(url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      mode: request.mode,
    });

    enhancedRequest.headers.set(CSRF_HEADER_NAME, token);
    return enhancedRequest;
  }

  async ensureToken(): Promise<string> {
    const cookieToken = getCookieValue();
    if (cookieToken) {
      return cookieToken;
    }

    return this.getToken();
  }

  clearCache(): void {
    this.cachedToken = null;
  }

  extractTokenFromCookie(): string | null {
    return getCookieValue();
  }
}

export const csrfClient = new CSRFClient({
  enableAutoTokenFetch: true,
  tokenRefreshInterval: 5 * 60 * 1000,
});

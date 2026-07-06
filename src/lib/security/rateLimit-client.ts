/**
 * Client-side rate limiting utilities for Sadat MLS Cloud.
 */
import { logger } from "@/lib/logger";

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimitClient {
  private defaultConfig = {
    windowMs: 60000, // 1 minute default
    maxRequests: 100,
    keyPrefix: "rl",
  };

  async checkRateLimit(
    endpoint: string,
    config?: Partial<RateLimitInfo>
  ): Promise<RateLimitInfo> {
    const url = new URL(endpoint, window.location.origin);
    
    try {
      const response = await fetch(url.toString(), {
        method: "HEAD",
        headers: {
          "X-RateLimit-Client": "true",
        },
      });

      const remaining = parseInt(response.headers.get("X-RateLimit-Remaining") || "0");
      const reset = parseInt(response.headers.get("X-RateLimit-Reset") || "0");
      const retryAfter = response.headers.get("Retry-After");

      const result: RateLimitInfo = { remaining, reset };
      if (retryAfter) result.retryAfter = parseInt(retryAfter);

      if (remaining < 20) {
        logger.warn(`Low rate limit remaining for ${endpoint}: ${remaining}`);
      }

      return result;
    } catch (error) {
      logger.error(`Rate limit check failed for ${endpoint}:`, { error: error instanceof Error ? error.message : String(error) });
      return { remaining: -1, reset: Date.now() + 60000, ...config };
    }
  }

  getClientKey(endpoint: string): string {
    const hash = this.hashString(endpoint);
    return `${this.defaultConfig.keyPrefix}.${hash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  shouldRetry(error: unknown, maxRetries: number = 3): boolean {
    if (maxRetries <= 0) return false;
    
    const err = error as { status?: number; headers?: { get(name: string): string | null } };
    if (err.status === 429) {
      return true;
    }
    
    return typeof err.status === "number" && err.status >= 500 && err.status < 600;
  }

  getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  }
}

export const rateLimitClient = new RateLimitClient();

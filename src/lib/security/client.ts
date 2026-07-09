"use client";

export interface ClientSecurityConfig {
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  sessionTimeout?: number;
  require2FA?: boolean;
  cookieSecure?: boolean;
  cookieSameSite?: "strict" | "lax" | "none";
  enableRateLimit?: boolean;
  enableCSRF?: boolean;
}

export class ClientSecurityManager {
  private static readonly DEFAULT_CONFIG: ClientSecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    require2FA: false,
    cookieSecure: false,
    cookieSameSite: "lax",
    enableRateLimit: true,
    enableCSRF: true,
  };

  private static loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  static configure(config: ClientSecurityConfig): void {
    Object.assign(this.DEFAULT_CONFIG, config);
  }

  private static getCookieSecure(): boolean {
    if (typeof window === "undefined") return false;
    return window.location.protocol === "https:";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async validateLogin(identifier: string, _password: string): Promise<{ isValid: boolean; reason?: string; i18nKey?: string; i18nParams?: Record<string, string | number> }> {
    const config = this.DEFAULT_CONFIG;

    // Check if account is locked out
    const attemptData = ClientSecurityManager.loginAttempts.get(identifier);
    if (attemptData && Date.now() < attemptData.lockUntil) {
      const remainingLockout = Math.ceil((attemptData.lockUntil - Date.now()) / 1000);
      return {
        isValid: false,
        reason: `Account temporarily locked. Try again in ${remainingLockout} seconds.`,
        i18nKey: "errors.accountLocked",
        i18nParams: { seconds: remainingLockout },
      };
    }

    // Rate limiting for login requests
    if (config.enableRateLimit) {
      const rateLimitKey = `login:${identifier}`;
      const rateLimitEntry = ClientSecurityManager.loginAttempts.get(rateLimitKey);
      const now = Date.now();

      if (rateLimitEntry && now < rateLimitEntry.lockUntil) {
        const remainingRequests = config.maxLoginAttempts! - rateLimitEntry.count;
        return {
          isValid: false,
          reason: `Too many login attempts. ${remainingRequests} attempts remaining.`,
          i18nKey: "errors.tooManyAttempts",
          i18nParams: { count: remainingRequests },
        };
      }
    }

    return { isValid: true };
  }

  static recordFailedLogin(identifier: string): void {
    const config = this.DEFAULT_CONFIG;
    const attempts = ClientSecurityManager.loginAttempts.get(identifier) || { count: 0, lockUntil: 0 };
    attempts.count++;

    if (attempts.count >= config.maxLoginAttempts!) {
      attempts.lockUntil = Date.now() + config.lockoutDuration!;
      attempts.count = 0;
    }

    ClientSecurityManager.loginAttempts.set(identifier, attempts);
  }

  static clearLoginAttempts(identifier: string): void {
    ClientSecurityManager.loginAttempts.delete(identifier);
  }

  static isLockedOut(identifier: string): { locked: boolean; remainingSeconds?: number } {
    const attemptData = ClientSecurityManager.loginAttempts.get(identifier);
    if (attemptData && Date.now() < attemptData.lockUntil) {
      return {
        locked: true,
        remainingSeconds: Math.ceil((attemptData.lockUntil - Date.now()) / 1000),
      };
    }
    return { locked: false };
  }

  static getSecurityHeaders(): Record<string, string> {
    
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'strict-dynamic'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join("; "),
      "X-Permitted-Cross-Domain-Policies": "none",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
    };
  }

  static setSecureCookies(name: string, value: string, options: {
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}): void {
    const {
      maxAge = 24 * 60 * 60,
      path = "/",
      secure = this.getCookieSecure(),
      sameSite = this.DEFAULT_CONFIG.cookieSameSite,
    } = options;

    const cookieOptions = [
      `${name}=${encodeURIComponent(value)}`,
      `Max-Age=${maxAge}`,
      `Path=${path}`,
      `SameSite=${sameSite}`,
      secure ? "Secure" : "",
    ].filter(Boolean).join("; ");
    
    document.cookie = cookieOptions;
  }

  static clearCookies(names: string[]): void {
    const secure = this.getCookieSecure();
    names.forEach(name => {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
    });
  }

  static isSecureContext(): boolean {
    return window.isSecureContext;
  }

  static getClientIp(): string | null {
    // Client-side IP detection (limited, mainly for logging)
    return null; // Can be implemented if needed with a backend API call
  }

  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  static sanitizeForLogging(input: string): string {
    // Remove potentially sensitive information from logs
    return input
      .replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, "[DATE]") // Dates
      .replace(/[0-9]{3}-[0-9]{3}-[0-9]{4}/g, "[PHONE]") // Phone numbers
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]") // Email addresses
      .replace(/\b\d{16}\b/g, "[CREDIT_CARD]"); // Credit card numbers
  }
}

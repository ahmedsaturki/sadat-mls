"use client";
import { getCsrfToken, getCsrfHeaders } from "@/lib/security/csrf-client";
import { ClientSecurityManager } from "@/lib/security/client";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  officeId?: string;
  fullName?: string;
  phone?: string;
}

interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  officeId?: string;
  exp?: number;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requires2FA?: boolean;
}

export interface RegisterResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export interface AuthTokens {
  jwt: string;
  refresh: string;
  expiresAt: number;
}

export class AuthService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  static async login(email: string, password: string): Promise<LoginResult> {
    // Validate input
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // Check if account is locked out
    const lockoutStatus = ClientSecurityManager.isLockedOut(email);
    if (lockoutStatus.locked) {
      return { 
        success: false, 
        error: `Account temporarily locked. Try again in ${lockoutStatus.remainingSeconds} seconds.` 
      };
    }

    try {
      const supabase = createClient();
      
      // Perform login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed login attempt
        ClientSecurityManager.recordFailedLogin(email);
        logger.error("Login error:", { error: error.message });
        return { success: false, error: error.message || "Login failed" };
      }

      if (!data.session || !data.user) {
        ClientSecurityManager.recordFailedLogin(email);
        return { success: false, error: "Login failed" };
      }

      // Clear failed login attempts on success
      ClientSecurityManager.clearLoginAttempts(email);

      // Fetch user profile
      const { data: profile } = await supabase
        .from("users")
        .select("id, email, full_name, role, office_id, avatar_url, is_active, created_at")
        .eq("id", data.user.id)
        .single();

      return { 
        success: true, 
        user: {
          id: data.user.id,
          email: profile?.email || data.user.email || "",
          role: profile?.role || "office_agent",
          officeId: profile?.office_id,
          fullName: profile?.full_name,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      logger.error("Login exception:", { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  static async logout(): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      logger.error("Logout error:", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  static getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    
    try {
      const supabase = createClient();
      // Note: This is a synchronous check - the actual session is managed by Supabase
      // For real-time auth state, use useAuthUser hook
      return null;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static getJwtToken(): string | null {
    if (typeof window === "undefined") return null;
    // Supabase manages tokens via its own cookie system
    return null;
  }

  static isSecureContext(): boolean {
    return ClientSecurityManager.isSecureContext();
  }

  static getClientIp(): string | null {
    return ClientSecurityManager.getClientIp();
  }

  static setupAuthInterceptors(): void {
    if (typeof window === "undefined") return;

    // Add CSRF token to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
      const isApiCall = url.startsWith(this.BASE_URL);
      
      if (isApiCall && init?.method && !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())) {
        const csrfHeaders = getCsrfHeaders();
        init.headers = new Headers({ ...init.headers, ...csrfHeaders });
      }
      
      return originalFetch(input, init);
    };
  }

  static isAdminUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "super_admin" || user?.role === "office_admin";
  }

  static canAccessResource(resource: string, userId: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Super admin has access to everything
    if (user.role === "super_admin") return true;
    
    // Add role-based permissions here
    switch (user.role) {
      case "office_admin":
        return ["office", "properties", "contacts"].includes(resource);
      case "office_agent":
        return ["properties", "contacts"].includes(resource);
      default:
        return false;
    }
  }
}

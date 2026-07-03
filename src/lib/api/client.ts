"use client";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { ProtectedApiClient } from "@/lib/api/protected";

export class ApiClient {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  static async createAgent(agentData: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "super_admin" | "office_admin" | "office_agent";
    office_id?: string;
  }): Promise<{ data: { success: boolean; userId?: string } | null; error: string | null; status: number }> {
    const ip = this.getClientIp();
    const rate = await checkApiRateLimit(`agents-post:${ip}`, "api", { windowMs: 60 * 1000, maxRequests: 20 });
    if (!rate.allowed) {
      return { data: null, error: "Rate limit exceeded. Please try again later.", status: 429 };
    }

    return ProtectedApiClient.post<{ success: boolean; userId?: string }>(`${this.BASE_URL}/api/agents`, agentData, {
      requireCsrf: true,
      enableRateLimit: false,
    });
  }

  static async deleteAgent(userId: string): Promise<{ data: { success: boolean } | null; error: string | null; status: number }> {
    const ip = this.getClientIp();
    const rate = await checkApiRateLimit(`agents-delete:${ip}`, "api", { windowMs: 60 * 1000, maxRequests: 20 });
    if (!rate.allowed) {
      return { data: null, error: "Rate limit exceeded. Please try again later.", status: 429 };
    }

    return ProtectedApiClient.delete<{ success: boolean }>(`${this.BASE_URL}/api/agents?id=${userId}`, {
      requireCsrf: true,
      enableRateLimit: false,
    });
  }

  static async resendVerification(email: string): Promise<{ data: { success: boolean; message: string; remaining: number } | null; error: string | null; status: number }> {
    const ip = this.getClientIp();
    const rate = await checkApiRateLimit(`resend:${ip}`, "api", { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rate.allowed) {
      return { data: null, error: "Too many resend requests. Please try again later.", status: 429 };
    }

    return ProtectedApiClient.post<{ success: boolean; message: string; remaining: number }>(`${this.BASE_URL}/api/auth/resend-verification`, { email }, {
      requireCsrf: true,
      enableRateLimit: false,
    });
  }

  static async forgotPasswordRateLimit(): Promise<{ error?: string }> {
    const ip = this.getClientIp();
    const rate = await checkApiRateLimit(`forgot:${ip}`, "api", { windowMs: 60 * 1000, maxRequests: 5 });
    if (!rate.allowed) {
      return { error: "Too many password reset requests. Please try again later." };
    }
    return { error: undefined };
  }

  static getClientIp(): string {
    return typeof window !== "undefined" ? "client-side" : "server-side";
  }
}

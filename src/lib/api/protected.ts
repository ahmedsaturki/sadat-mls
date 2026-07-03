"use client";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import { csrfClient } from "@/lib/security/csrf-client";

export interface ProtectedApiOptions extends RequestInit {
  requireCsrf?: boolean;
  enableRateLimit?: boolean;
}

export class ProtectedApiClient {
  private static async fetchWithSecurity<T>(
    url: string,
    options: ProtectedApiOptions = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    const { requireCsrf = true, enableRateLimit: _enableRateLimit = true, ...fetchOptions } = options;

    try {
      const headers = new Headers(fetchOptions.headers);

      if (requireCsrf) {
        const token = await csrfClient.getToken();
        headers.set(CSRF_HEADER_NAME, token);
      }

      if (!headers.has("Content-Type") && fetchOptions.method !== "GET") {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Request failed" }));
        return {
          data: null,
          error: errorData.error || errorData.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  static async post<T>(
    url: string,
    body: unknown,
    options: ProtectedApiOptions = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.fetchWithSecurity<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  static async put<T>(
    url: string,
    body: unknown,
    options: ProtectedApiOptions = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.fetchWithSecurity<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  static async delete<T>(
    url: string,
    options: ProtectedApiOptions = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.fetchWithSecurity<T>(url, {
      ...options,
      method: "DELETE",
    });
  }

  static async get<T>(
    url: string,
    options: ProtectedApiOptions = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    return this.fetchWithSecurity<T>(url, {
      ...options,
      method: "GET",
    });
  }
}

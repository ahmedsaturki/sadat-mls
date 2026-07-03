import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/utils/constants";

export interface AuthUser {
  user: { id: string } | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    office_id: string | null;
  } | null;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Get auth user for server-side rendering.
 * Note: In serverless environments, caching at module level is unsafe.
 * Each request gets fresh auth data to prevent user data leakage.
 */
export async function getServerAuth(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Expected in Server Components (cookies immutable after response).
            // Log in non-SC contexts for debugging token refresh failures.
            if (process.env.NODE_ENV === "development") {
              console.debug("[server-auth] cookie write skipped (expected in SC)");
            }
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let profile: AuthUser["profile"] = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name, role, office_id")
      .eq("id", user.id)
      .maybeSingle();
    
    profile = data;
  }

  return { user, profile, supabase };
}

export async function getServerUser() {
  const { user } = await getServerAuth();
  return user;
}

export async function getServerProfile() {
  const { profile } = await getServerAuth();
  return profile;
}

export async function clearAuthCache() {
  // No-op in serverless - each request is independent
}

/**
 * Get authenticated user and profile.
 * Returns null user/profile if not authenticated.
 */
export async function getAuthenticatedUser() {
  const { user, profile } = await getServerAuth();
  return { user, profile };
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(redirectPath: string) {
  const { user, profile } = await getServerAuth();
  if (!user) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  return { user, profile };
}

/**
 * Require specific role. Throws if not authenticated or wrong role.
 */
export async function requireRole(requiredRole: UserRole, redirectPath: string) {
  const { user, profile } = await requireAuth(redirectPath);
  if (!profile || profile.role !== requiredRole) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  return { user, profile };
}
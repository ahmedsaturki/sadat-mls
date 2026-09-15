import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/types";

export interface AuthUser {
  user: { id: string } | null;
  /**
   * Business profile is intentionally unavailable until an authoritative
   * auth.users -> people mapping exists in the Aqarat OS schema.
   * Returning null is fail-closed for protected role-gated flows.
   */
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    office_id: string | null;
  } | null;
  supabase: ReturnType<typeof createServerClient<Database>>;
}

/**
 * Get the authenticated Supabase identity for server-side rendering.
 *
 * IMPORTANT: Aqarat OS separates authentication identity from business
 * entities. The legacy public.users table is not part of the live contract,
 * and no authoritative auth.users -> people mapping has been proven yet.
 */
export async function getServerAuth(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            if (process.env.NODE_ENV === "development") {
              logger.debug("[server-auth] cookie write skipped (expected in SC)");
            }
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Deliberately fail closed until the database contains an authoritative
  // mapping between auth identity and business-person identity/role.
  const profile: AuthUser["profile"] = null;

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

export async function getAuthenticatedUser() {
  const { user, profile } = await getServerAuth();
  return { user, profile };
}

export async function requireAuth(redirectPath: string) {
  const { user, profile } = await getServerAuth();
  if (!user) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  return { user, profile };
}

export async function requireRole(requiredRole: UserRole, redirectPath: string) {
  const { user, profile } = await requireAuth(redirectPath);
  if (!profile || profile.role !== requiredRole) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  return { user, profile };
}

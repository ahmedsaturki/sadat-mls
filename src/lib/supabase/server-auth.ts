import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";

export interface AuthUser {
  user: { id: string } | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole | null;
    office_id: string | null;
  } | null;
  supabase: ReturnType<typeof createServerClient>;
}

function mapAuthProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) : AuthUser["profile"] {
  const metadata = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? null,
    full_name: typeof metadata.full_name === "string" ? metadata.full_name : null,
    // Authorization roles are intentionally not trusted from user-editable metadata.
    role: null,
    office_id: null,
  };
}

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

  const { data, error } = await supabase.auth.getUser();
  if (error) logger.debug("[server-auth] getUser failed", { error: error.message });

  const user = data.user;
  return {
    user: user ? { id: user.id } : null,
    profile: user ? mapAuthProfile(user) : null,
    supabase,
  };
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
  // No-op in serverless; each request is independent.
}

export async function getAuthenticatedUser() {
  const { user, profile } = await getServerAuth();
  return { user, profile };
}

export async function requireAuth(redirectPath: string) {
  const { user, profile } = await getServerAuth();
  if (!user) throw new Error(`REDIRECT:${redirectPath}`);
  return { user, profile };
}

export async function requireRole(requiredRole: UserRole, redirectPath: string) {
  const { user, profile } = await requireAuth(redirectPath);
  if (!profile?.role || profile.role !== requiredRole) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  return { user, profile };
}
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
          } catch {}
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
      .single();
    
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
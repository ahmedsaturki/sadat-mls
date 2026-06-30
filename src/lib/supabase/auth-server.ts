import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/utils/constants";
import type { User } from "@supabase/supabase-js";

interface AuthenticatedUser {
  user: User | null;
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    office_id: string | null;
  } | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role, office_id")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as UserProfile | null };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  office_id: string | null;
}

export async function requireAuth(redirectPath: string): Promise<AuthenticatedUser> {
  const { user, profile } = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  
  return { user, profile };
}

export async function requireRole(requiredRole: UserRole, redirectPath: string): Promise<AuthenticatedUser> {
  const { user, profile } = await requireAuth(redirectPath);
  
  if (!profile || profile.role !== requiredRole) {
    throw new Error(`REDIRECT:${redirectPath}`);
  }
  
  return { user, profile };
}
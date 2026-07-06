import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  officeId?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      logger.debug("No active session found");
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, full_name, role, office_id")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      logger.error("Error fetching user profile:", { error: profileError.message });
      return null;
    }

    return {
      id: profile.id,
      email: profile.email || "",
      fullName: profile.full_name,
      role: profile.role,
      officeId: profile.office_id,
    };
  } catch (error) {
    logger.error("Unexpected error in getCurrentUser:", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function requireAuth(redirectPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const callbackUrl = redirectPath || `/ar/dashboard`;
    redirect(`${callbackUrl}?error=unauthorized`);
  }
  return user;
}

export async function requireRole(role: string | string[], redirectPath?: string): Promise<User> {
  const user = await requireAuth(redirectPath);
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(`${redirectPath || `/ar/dashboard`}?error=insufficient-permissions`);
  }
  return user;
}

export async function requireSuperAdmin(redirectPath?: string): Promise<User> {
  return requireRole("super_admin", redirectPath);
}

export async function requireOfficeAdmin(redirectPath?: string): Promise<User> {
  return requireRole(["super_admin", "office_admin"], redirectPath);
}

export async function requireOfficeAgent(redirectPath?: string): Promise<User> {
  return requireRole(["super_admin", "office_admin", "office_agent"], redirectPath);
}

export async function getUserOfficeId(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("office_id")
      .eq("id", userId)
      .single();

    if (error || !data) {
      logger.error("Error fetching user office_id:", { error: error?.message ?? "Unknown error" });
      return null;
    }

    return data.office_id;
  } catch (error) {
    logger.error("Unexpected error in getUserOfficeId:", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setSession(_user: User): Promise<void> {
  try {
    const supabase = await createClient();
    // Create server-side session if needed
    const { error } = await supabase.auth.setSession({
      access_token: "", // In real implementation, handle proper token
      refresh_token: "",
    });

    if (error) {
      logger.error("Error setting session:", { error: error instanceof Error ? error.message : String(error) });
    }
  } catch (error) {
    logger.error("Unexpected error in setSession:", { error: error instanceof Error ? error.message : String(error) });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { validateCsrfToken } from "@/lib/security/csrf";
import { PasswordService } from "@/lib/security/password";
import { ROLES } from "@/lib/utils/constants";
import { logActivity } from "@/lib/utils/activity-logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const supabase = createServiceRoleClient();

  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser) user = authUser;
    } catch {
      // ignore
    }
  }

  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from("users")
      .select("role, office_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== ROLES.SUPER_ADMIN) return null;
    return { ...user, office_id: profile.office_id, role: profile.role };
  } catch {
    logger.error("Failed to query user profile during admin verification", { userId: user.id });
    return null;
  }
}

// GET - List all users (super_admin only)
export async function GET(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-users-get:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const querySchema = z.object({
    search: z.string().max(100).regex(/^[a-zA-Z0-9\s@._-]*$/, "Invalid search characters").default(""),
    role: z.enum(["", ...Object.values(ROLES)] as [string, ...string[]]).default(""),
    office_id: z.string().uuid("Invalid office ID").or(z.literal("")).default(""),
  });

  const parsed = querySchema.safeParse({
    search: searchParams.get("search") || "",
    role: searchParams.get("role") || "",
    office_id: searchParams.get("office_id") || "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { search, role, office_id: officeId } = parsed.data;

  let query = supabase
    .from("users")
    .select("id, email, full_name, phone, role, office_id, is_active, created_at, updated_at");

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role) {
    query = query.eq("role", role);
  }

  if (officeId) {
    query = query.eq("office_id", officeId);
  }

  query = query.order("created_at", { ascending: false }).limit(200);

  const { data: users, error } = await query;

  if (error) {
    logger.error("Failed to list users", { error: error.message });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Fetch office names for display
  const officeIds = [...new Set((users || []).map((u) => u.office_id).filter(Boolean))];
  let officeMap: Record<string, string> = {};
  if (officeIds.length > 0) {
    const { data: offices } = await supabase
      .from("offices")
      .select("id, name")
      .in("id", officeIds);
    officeMap = Object.fromEntries((offices || []).map((o) => [o.id, o.name]));
  }

  const usersWithOffice = (users || []).map((u) => ({
    ...u,
    office_name: officeMap[u.office_id] || null,
  }));

  return NextResponse.json({ users: usersWithOffice });
}

// POST - Create new user (super_admin only)
export async function POST(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-users-post:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const createUserSchema = z.object({
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(1),
    full_name: z.string().min(1, "Name is required").max(100),
    role: z.enum(Object.values(ROLES) as [string, ...string[]]),
    office_id: z.string().uuid("Invalid office ID").or(z.literal("")).optional(),
  });

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, full_name, role, office_id } = parsed.data;

  const passwordValidation = PasswordService.validate(password);
  if (!passwordValidation.isValid) {
    return NextResponse.json({ error: passwordValidation.errors.join(", ") }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || "" },
  });

  if (authError) {
    logger.error("Failed to create auth user", { error: authError.message, email });
    if (authError.message.includes("already registered")) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Create profile in users table
  const { error: profileError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      email,
      full_name: full_name || "",
      role,
      office_id: office_id || null,
      is_active: true,
    });

  if (profileError) {
    logger.error("Failed to create user profile", { error: profileError.message, userId: authData.user.id });
    // Cleanup: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
  }

  logger.info("User created successfully", { userId: authData.user.id, email, role, createdBy: user.id });

  // Log activity
  await logActivity({
    userId: user.id,
    action: "user.created",
    entityType: "user",
    entityId: authData.user.id,
    entityTitle: full_name || email,
    metadata: { email, role, office_id },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true, userId: authData.user.id });
}

// PATCH - Update user role (super_admin only)
export async function PATCH(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-users-patch:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patchUserSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['super_admin', 'office_admin', 'office_agent']).optional(),
    is_active: z.boolean().optional(),
    fullName: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
  });

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { userId, role, is_active, fullName, email } = parsed.data;

  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role) {
    updates.role = role;
  }
  if (typeof is_active === "boolean") {
    updates.is_active = is_active;
  }
  if (fullName) {
    updates.full_name = fullName;
  }
  if (email) {
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (error) {
    logger.error("Failed to update user", { error: error.message, userId });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  logger.info("User updated successfully", { userId, updates, updatedBy: user.id });

  // Log activity
  await logActivity({
    userId: user.id,
    action: "user.updated",
    entityType: "user",
    entityId: userId,
    metadata: { updates },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}

// DELETE - Delete user (super_admin only)
export async function DELETE(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-users-delete:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    logger.error("Failed to delete user", { error: error.message, userId });
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }

  logger.info("User deleted successfully", { userId, deletedBy: user.id });

  // Log activity
  await logActivity({
    userId: user.id,
    action: "user.deleted",
    entityType: "user",
    entityId: userId,
    metadata: { deletedBy: user.id },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}

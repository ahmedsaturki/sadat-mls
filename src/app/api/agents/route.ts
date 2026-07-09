import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { validateCsrfToken } from "@/lib/security/csrf";
import { agentSchema } from "@/lib/validation";
import { ROLES } from "@/lib/utils/constants";
import { logActivity } from "@/lib/utils/activity-logger";
import { notifyOffice } from "@/lib/utils/notifier";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const supabase = getAdminClient();

  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser) user = authUser;
    } catch {
      // Network or Supabase error — treat as unauthenticated
    }
  }

  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from("users")
      .select("role, office_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== ROLES.SUPER_ADMIN && profile?.role !== ROLES.OFFICE_ADMIN) return null;
    return { ...user, office_id: profile.office_id, role: profile.role };
  } catch {
    logger.error("Failed to query user profile during admin verification", { userId: user.id });
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`agents-post:${ip}`);
  if (!rate.allowed) {
    logger.warn("Rate limit exceeded on agents POST", { ip });
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  // CSRF validation
  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    logger.warn("Invalid CSRF token on agents POST", { ip });
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifyAdmin(request);
  if (!user) {
    logger.warn("Unauthorized agents POST attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const result = agentSchema.safeParse(body);
  if (!result.success) {
    logger.warn("Invalid agent data", { errors: result.error.flatten().fieldErrors });
    return NextResponse.json({ error: "Invalid data", details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, password, fullName, role: agentRole, officeId } = result.data;
  // Zod schema already validates format — do NOT run HTML-entity sanitizer on
  // email/name/phone as it corrupts values (e.g. adds "&amp;" into addresses).
  const sanitizedEmail = email.trim();
  const sanitizedName = fullName.trim();
  const phone = result.data.phone ? result.data.phone.trim() : "";

  // Role assignment based on caller's role
  // SUPER_ADMIN can specify any role, OFFICE_ADMIN can only create OFFICE_AGENT
  const role = user.role === ROLES.SUPER_ADMIN
    ? (agentRole === ROLES.OFFICE_ADMIN ? ROLES.OFFICE_ADMIN : ROLES.OFFICE_AGENT)
    : ROLES.OFFICE_AGENT;
  const office_id = user.office_id;

  // Validate office_id for OFFICE_ADMIN - must have one
  if (user.role === ROLES.OFFICE_ADMIN && !office_id) {
    return NextResponse.json({ error: "OFFICE_ADMIN must belong to an office" }, { status: 400 });
  }

  // Validate officeId in body for SUPER_ADMIN
  if (user.role === ROLES.SUPER_ADMIN && officeId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(officeId)) {
    return NextResponse.json({ error: "Invalid office ID format" }, { status: 400 });
  }

  const targetOfficeId = user.role === ROLES.SUPER_ADMIN && officeId ? officeId : office_id;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabaseAdmin = getAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: sanitizedEmail,
    password,
    email_confirm: true,
  });

  if (authError) {
    logger.error("Failed to create user", { error: authError.message });
    return NextResponse.json({ error: "Failed to create user account" }, { status: 400 });
  }

  if (authData.user) {
    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: authData.user.id,
      office_id: targetOfficeId,
      email: sanitizedEmail,
      full_name: sanitizedName,
      phone,
      role,
    }, { onConflict: "id" });

    if (profileError) {
      logger.error("Failed to create user profile", { error: profileError.message, userId: authData.user.id });
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 400 });
    }
  }

  logger.info("Agent created successfully", { userId: authData.user?.id, createdBy: user.id });

  // Log activity
  await logActivity({
    userId: user.id,
    officeId: targetOfficeId,
    action: "agent.created",
    entityType: "agent",
    entityId: authData.user?.id,
    entityTitle: sanitizedName,
    metadata: { email: sanitizedEmail, role },
    ipAddress: ip,
  });

  // Notify office members (fire-and-forget)
  if (targetOfficeId) {
    notifyOffice(targetOfficeId, {
      type: "agent_joined",
      title: "newAgentJoined",
      title_params: { name: sanitizedName },
      message: "newAgentJoinedMessage",
      message_params: { name: sanitizedName, email: sanitizedEmail, role: role === ROLES.OFFICE_ADMIN ? "Office Admin" : "Office Agent" },
      entityType: "agent",
      entityId: authData.user?.id,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, userId: authData.user?.id });
}

export async function DELETE(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`agents-delete:${ip}`);
  if (!rate.allowed) {
    logger.warn("Rate limit exceeded on agents DELETE", { ip });
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  // CSRF validation
  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    logger.warn("Invalid CSRF token on agents DELETE", { ip });
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifyAdmin(request);
  if (!user) {
    logger.warn("Unauthorized agents DELETE attempt", { ip });
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

// Validate office ownership for OFFICE_ADMIN - can only delete agents from their office
  if (user.role === ROLES.OFFICE_ADMIN && user.office_id) {
    const client = getAdminClient();
    let targetUser;
    try {
      const { data, error: queryError } = await client
        .from("users")
        .select("office_id, role")
        .eq("id", userId)
        .maybeSingle();
      if (queryError) {
        logger.error("Failed to query target user for deletion", { error: queryError.message, userId });
        return NextResponse.json({ error: "Failed to verify user" }, { status: 400 });
      }
      targetUser = data;
    } catch {
      logger.error("Unexpected error querying target user for deletion", { userId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!targetUser || targetUser.office_id !== user.office_id) {
      logger.warn("OFFICE_ADMIN attempted to delete agent from different office", {
        adminId: user.id,
        targetUserId: userId,
        adminOffice: user.office_id,
        targetOffice: targetUser?.office_id,
      });
      return NextResponse.json({ error: "Cannot delete agents from other offices" }, { status: 403 });
    }

    if (targetUser.role !== ROLES.OFFICE_AGENT) {
      return NextResponse.json({ error: "Can only delete OFFICE_AGENT users" }, { status: 403 });
    }
  }

  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    logger.error("Failed to delete user", { error: error.message, userId });
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }

  logger.info("Agent deleted successfully", { userId, deletedBy: user.id });

  // Log activity
  await logActivity({
    userId: user.id,
    officeId: user.office_id,
    action: "agent.deleted",
    entityType: "agent",
    entityId: userId,
    metadata: { deletedBy: user.id },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}

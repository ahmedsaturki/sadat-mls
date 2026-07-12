import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { validateCsrfToken } from "@/lib/security/csrf";
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

// PATCH - Update office (super_admin only)
export async function PATCH(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-offices-patch:${ip}`);
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

  const patchOfficeSchema = z.object({
    id: z.string().uuid("Invalid office ID"),
    name: z.string().min(2).max(200).optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
  });

  const parsed = patchOfficeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, ...updates } = parsed.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("offices")
    .update(updates)
    .eq("id", id);

  if (error) {
    logger.error("Failed to update office", { error: error.message, officeId: id });
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }

  logger.info("Office updated successfully", { officeId: id, updates, updatedBy: user.id });

  await logActivity({
    userId: user.id,
    action: "office.updated",
    entityType: "office",
    entityId: id,
    metadata: { updates },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}

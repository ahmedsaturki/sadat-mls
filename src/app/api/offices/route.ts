import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { officeSchema } from "@/lib/validation";
import { ROLES } from "@/lib/utils/constants";
import { logActivity } from "@/lib/utils/activity-logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const supabase = createServiceRoleClient();

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

// GET - List offices (super admin sees all, office admin sees own)
export async function GET(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`offices-get:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const querySchema = z.object({
    search: z.string().max(100).regex(/^[a-zA-Z0-9\s@._-]*$/, "Invalid search characters").default(""),
    active: z.enum(["true", "false", ""]).default(""),
  });

  const parsed = querySchema.safeParse({
    search: searchParams.get("search") || "",
    active: searchParams.get("active") || "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { search, active } = parsed.data;

  let query = supabase
    .from("offices")
    .select("id, name, slug, email, phone, address, description, logo_url, is_active, created_at, updated_at");

  // Office admin can only see their own office
  if (user.role === ROLES.OFFICE_ADMIN && user.office_id) {
    query = query.eq("id", user.office_id);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (active === "true") {
    query = query.eq("is_active", true);
  } else if (active === "false") {
    query = query.eq("is_active", false);
  }

  query = query.order("created_at", { ascending: false }).limit(100);

  const { data: offices, error } = await query;

  if (error) {
    logger.error("Failed to list offices", { error: error.message });
    return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 });
  }

  return NextResponse.json({ offices: offices || [] });
}

// POST - Create office (super admin only)
export async function POST(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`offices-post:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    logger.warn("Invalid CSRF token on offices POST", { ip });
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifyAdmin(request);
  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = officeSchema.safeParse(body);
  if (!result.success) {
    logger.warn("Invalid office data", { errors: result.error.flatten().fieldErrors });
    return NextResponse.json({ error: "Invalid data", details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, slug, email, phone, address, description, logoUrl } = result.data;

  const supabase = createServiceRoleClient();

  const { data: office, error } = await supabase
    .from("offices")
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      email: email || null,
      phone: phone || null,
      address: address || null,
      description: description || null,
      logo_url: logoUrl || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create office", { error: error.message });
    if (error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "An office with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
  }

  logger.info("Office created successfully", { officeId: office.id, name, createdBy: user.id });

  await logActivity({
    userId: user.id,
    action: "office.created",
    entityType: "office",
    entityId: office.id,
    entityTitle: name,
    metadata: { name, slug },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true, officeId: office.id });
}

// PATCH - Update office (super admin or office admin for own office)
export async function PATCH(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`offices-patch:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    logger.warn("Invalid CSRF token on offices PATCH", { ip });
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifyAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100).optional(),
    slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Slug can only contain lowercase letters, numbers, and hyphens").optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    is_active: z.boolean().optional(),
  });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id: officeId, ...updates } = parsed.data;

  // Office admin can only update their own office
  if (user.role === ROLES.OFFICE_ADMIN && user.office_id !== officeId) {
    return NextResponse.json({ error: "Cannot update other offices" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  // Build update object, only including defined fields
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("offices")
    .update(updateData)
    .eq("id", officeId);

  if (error) {
    logger.error("Failed to update office", { error: error.message, officeId });
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }

  logger.info("Office updated successfully", { officeId, updates: Object.keys(updateData), updatedBy: user.id });

  await logActivity({
    userId: user.id,
    action: "office.updated",
    entityType: "office",
    entityId: officeId,
    metadata: { updates: Object.keys(updateData) },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { escapeHtmlEntities } from "@/lib/security/sanitizeHtml";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const contactRequestSchema = z.object({
  propertyId: z.string().uuid().optional().nullable(),
  officeId: z.string().uuid().optional().nullable(),
  contactType: z.enum(["whatsapp", "phone", "email"]),
  visitorName: z.string().trim().min(1).max(100),
  visitorPhone: z.string().trim().max(50).optional().nullable(),
  visitorEmail: z.string().trim().max(255).optional().nullable().refine(
    (value) => !value || z.string().email().safeParse(value).success,
    { message: "Invalid email" },
  ),
  message: z.string().trim().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`contact-post:${ip}`, undefined, { maxRequests: 5, windowMs: 60 * 60 * 1000 });

  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  // Defence-in-depth: Zod validates shape; SecurityValidator scrubs XSS/SQL-injection
  // text from untrusted visitor inputs before they reach the database.
  const raw = parsed.data;
  const data = {
    ...raw,
    visitorName: escapeHtmlEntities(raw.visitorName),
    visitorEmail: raw.visitorEmail ? escapeHtmlEntities(raw.visitorEmail) : raw.visitorEmail,
    message: escapeHtmlEntities(raw.message),
  };

  try {
    let targetOfficeId = data.officeId || null;

    if (data.propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("office_id, is_active")
        .eq("id", data.propertyId)
        .maybeSingle();

      if (propertyError) {
        logger.error("Failed to validate contact property", { error: propertyError.message });
        return NextResponse.json({ error: "Failed to validate property" }, { status: 500 });
      }

      if (!property?.is_active) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }

      if (targetOfficeId && targetOfficeId !== property.office_id) {
        return NextResponse.json({ error: "Property does not belong to office" }, { status: 400 });
      }

      targetOfficeId = property.office_id;
    }

    if (!targetOfficeId) {
      const { data: office, error: officeError } = await supabase
        .from("offices")
        .select("id")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (officeError) {
        logger.error("Failed to resolve active office for contact request", { error: officeError.message });
        return NextResponse.json({ error: "Failed to resolve office" }, { status: 500 });
      }

      targetOfficeId = office?.id || null;
    }

    if (!targetOfficeId) {
      return NextResponse.json({ error: "No active office available" }, { status: 400 });
    }

    const { data: contactRequest, error: insertError } = await supabase
      .from("contact_requests")
      .insert({
        property_id: data.propertyId || null,
        office_id: targetOfficeId,
        contact_type: data.contactType,
        visitor_name: data.visitorName,
        visitor_phone: data.visitorPhone || null,
        visitor_email: data.visitorEmail || null,
        message: data.message,
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error("Failed to create contact request", { error: insertError.message });
      return NextResponse.json({ error: "Failed to create contact request" }, { status: 500 });
    }

    const { data: members, error: membersError } = await supabase
      .from("users")
      .select("id")
      .eq("office_id", targetOfficeId)
      .eq("is_active", true);

    if (membersError) {
      logger.error("Failed to fetch office members for contact notification", { error: membersError.message });
    } else if (members?.length) {
      const notifications = members.map((member) => ({
        user_id: member.id,
        office_id: targetOfficeId,
        type: "contact_request",
        title: "newContactRequest",
        title_params: { name: data.visitorName },
        message: data.message.substring(0, 200),
        entity_type: "contact_request",
        entity_id: contactRequest.id,
      }));

      const { error: notificationError } = await supabase.from("notifications").insert(notifications);
      if (notificationError) {
        logger.error("Failed to create contact notifications", { error: notificationError.message });
      }
    }

    return NextResponse.json({ success: true, id: contactRequest.id });
  } catch (error) {
    logger.error("Contact API error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

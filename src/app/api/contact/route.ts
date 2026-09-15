import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { escapeHtmlEntities } from "@/lib/security/sanitizeHtml";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const contactSchema = z.object({
  propertyId: z.string().uuid().optional().nullable(),
  contactType: z.enum(["whatsapp", "phone", "email"]),
  visitorName: z.string().trim().min(1).max(100),
  visitorPhone: z.string().trim().max(50).optional().nullable(),
  visitorEmail: z.string().trim().max(255).optional().nullable().refine(
    (value) => !value || z.string().email().safeParse(value).success,
    { message: "Invalid email" },
  ),
  message: z.string().trim().min(1).max(1000),
});

type ContactRow = {
  person_id: string;
  contact_type: string;
  value: string;
  normalized_value: string;
  is_primary: boolean;
  verified: boolean;
  confidence: number;
};

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const rate = await checkApiRateLimit(`contact-post:${ip}`, undefined, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rate.headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const raw = parsed.data;
  const data = {
    ...raw,
    visitorName: escapeHtmlEntities(raw.visitorName),
    visitorEmail: raw.visitorEmail ? escapeHtmlEntities(raw.visitorEmail) : null,
    message: escapeHtmlEntities(raw.message),
    visitorPhone: raw.visitorPhone ? escapeHtmlEntities(raw.visitorPhone) : null,
  };

  const supabase = createServiceRoleClient();

  try {
    if (data.propertyId) {
      const { data: property, error } = await supabase
        .from("properties")
        .select("id, status")
        .eq("id", data.propertyId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        logger.error("Failed to validate contact property", { error: error.message });
        return NextResponse.json({ error: "Failed to validate property" }, { status: 500 });
      }
      if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const { data: person, error: personError } = await supabase
      .from("people")
      .insert({
        full_name: data.visitorName,
        role: "unknown",
        notes: `Public contact request (${data.contactType})`,
        confidence: 1,
      })
      .select("id")
      .single();

    if (personError || !person) {
      logger.error("Failed to create contact person", { error: personError?.message || "missing person" });
      return NextResponse.json({ error: "Failed to create contact request" }, { status: 500 });
    }

    const contactRows: ContactRow[] = [];
    if (data.visitorEmail) {
      contactRows.push({
        person_id: person.id,
        contact_type: "email",
        value: data.visitorEmail,
        normalized_value: data.visitorEmail.toLowerCase(),
        is_primary: data.contactType === "email",
        verified: false,
        confidence: 1,
      });
    }
    if (data.visitorPhone) {
      contactRows.push({
        person_id: person.id,
        contact_type: data.contactType === "whatsapp" ? "whatsapp" : "phone",
        value: data.visitorPhone,
        normalized_value: data.visitorPhone.replace(/\D/g, ""),
        is_primary: data.contactType !== "email",
        verified: false,
        confidence: 1,
      });
    }

    if (contactRows.length) {
      const { error: contactsError } = await supabase.from("contacts").insert(contactRows);
      if (contactsError) {
        logger.error("Failed to create contact details", { error: contactsError.message });
        return NextResponse.json({ error: "Failed to create contact request" }, { status: 500 });
      }
    }

    const { data: interaction, error: interactionError } = await supabase
      .from("interactions")
      .insert({
        person_id: person.id,
        property_id: data.propertyId || null,
        channel: data.contactType,
        interaction_type: "contact_request",
        direction: "inbound",
        payload: {
          visitor_name: data.visitorName,
          visitor_email: data.visitorEmail,
          visitor_phone: data.visitorPhone,
          message: data.message,
          source: "public_contact_form",
          ip,
        },
        observed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (interactionError || !interaction) {
      logger.error("Failed to record contact interaction", {
        error: interactionError?.message || "missing interaction",
      });
      return NextResponse.json({ error: "Failed to create contact request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: interaction.id });
  } catch (error) {
    logger.error("Contact API error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

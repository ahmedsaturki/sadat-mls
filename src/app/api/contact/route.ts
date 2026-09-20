import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { createPublicApiClient } from "@/lib/supabase/public-api";

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

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rate = await checkApiRateLimit(`contact-post:${ip}`, undefined, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (rate.unavailable) {
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable" },
      { status: 503, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } },
    );
  }

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rate.headers },
    );
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

  try {
    const supabase = createPublicApiClient();
    const { data: result, error } = await supabase.rpc("submit_public_contact", {
      p_property_id: raw.propertyId ?? null,
      p_contact_type: raw.contactType,
      p_visitor_name: raw.visitorName,
      p_visitor_phone: raw.visitorPhone ?? null,
      p_visitor_email: raw.visitorEmail ?? null,
      p_message: raw.message,
      p_client_ip: ip,
    });

    if (error) {
      logger.error("Public contact RPC failed", { error: error.message });
      return NextResponse.json(
        { error: "Failed to create contact request" },
        { status: 500 },
      );
    }

    if (!result || typeof result !== "object") {
      logger.error("Public contact RPC returned an invalid response");
      return NextResponse.json(
        { error: "Failed to create contact request" },
        { status: 500 },
      );
    }

    const rpcResult = result as {
      success?: boolean;
      error?: string;
      id?: string;
      remaining?: number;
      retryAfter?: number;
      resetAt?: number;
    };

    if (rpcResult.error === "property_not_found") {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (rpcResult.error === "rate_limited") {
      const retryAfter = Math.max(1, Math.ceil(rpcResult.retryAfter ?? 30));
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String((rpcResult.resetAt ?? 0) * 1000),
          },
        },
      );
    }

    if (!rpcResult.success || !rpcResult.id) {
      logger.error("Public contact RPC rejected request");
      return NextResponse.json(
        { error: "Failed to create contact request" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: rpcResult.id });
  } catch (error) {
    logger.error("Contact API error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

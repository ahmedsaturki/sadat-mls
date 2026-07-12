import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const createOfferSchema = z.object({
  property_id: z.string().uuid(),
  offerer_name: z.string().min(1).max(100),
  offerer_email: z.string().email().optional().nullable(),
  offerer_phone: z.string().max(50).optional().nullable(),
  offer_amount: z.number().positive(),
  message: z.string().max(1000).optional().nullable(),
  referral_code: z.string().max(20).optional().nullable(),
});

// GET - List offers for current user's office
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`offers-get:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's office
    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    let query = supabase
      .from("property_offers")
      .select("*, properties(title)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Super admin sees all, office members see their office only
    if (profile.role !== "super_admin") {
      query = query.eq("office_id", profile.office_id);
    }

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: offers, error } = await query;

    if (error) {
      logger.error("Failed to fetch offers", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
    }

    return NextResponse.json({ offers: offers || [] });
  } catch (err) {
    logger.error("Offers API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Submit a new offer (public, requires auth)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`offers-post:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { property_id, offerer_name, offerer_email, offerer_phone, offer_amount, message, referral_code } = parsed.data;

    // Get property and its office
    const serviceRole = createServiceRoleClient();
    const { data: property, error: propertyError } = await serviceRole
      .from("properties")
      .select("office_id, title, is_active")
      .eq("id", property_id)
      .maybeSingle();

    if (propertyError || !property || !property.is_active) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Look up referring office if referral code provided
    let referringOfficeId: string | null = null;
    if (referral_code) {
      const { data: referringOffice } = await serviceRole
        .from("offices")
        .select("id")
        .eq("referral_code", referral_code.toUpperCase())
        .single();
      if (referringOffice) {
        referringOfficeId = referringOffice.id;
      }
    }

    // Create the offer
    const { data: offer, error: offerError } = await serviceRole
      .from("property_offers")
      .insert({
        property_id,
        office_id: property.office_id,
        offerer_name,
        offerer_email: offerer_email || null,
        offerer_phone: offerer_phone || null,
        offer_amount,
        message: message || null,
        referring_office_id: referringOfficeId,
        status: "pending",
      })
      .select("id")
      .single();

    if (offerError) {
      logger.error("Failed to create offer", { error: offerError.message });
      return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
    }

    // Send email notification to office (fire-and-forget)
    const { isEmailEnabled } = await import("@/lib/email/config");
    if (isEmailEnabled()) {
      const { sendEmail } = await import("@/lib/email/send");
      const { data: office } = await serviceRole.from("offices").select("name").eq("id", property.office_id).single();
      const { data: members } = await serviceRole
        .from("users")
        .select("email, notification_preferences")
        .eq("office_id", property.office_id)
        .eq("is_active", true);

      if (members?.length && office) {
        const formatPrice = (p: number) => new Intl.NumberFormat("ar-EG").format(p) + " EGP";
        for (const member of members) {
          if (!member.email) continue;
          const prefs = member.notification_preferences;
          if (prefs && typeof prefs === "object" && prefs.contact_request_email === false) continue;

          const subject = `عرض جديد على ${property.title} - ${formatPrice(offer_amount)}`;
          const html = `<div style="font-family:sans-serif;padding:20px;"><h2>عرض جديد</h2><p>عرض من <strong>${offerer_name}</strong> بقيمة <strong>${formatPrice(offer_amount)}</strong> على العقار <strong>${property.title}</strong>.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/offers" style="background:#1B2D4F;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">عرض العروض</a></p></div>`;
          sendEmail({ to: member.email, subject, html }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, offerId: offer.id });
  } catch (err) {
    logger.error("Offer create error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

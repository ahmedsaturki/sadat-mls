import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const updateOfferSchema = z.object({
  status: z.enum(["accepted", "rejected", "countered"]),
  counter_amount: z.number().positive().optional(),
  counter_message: z.string().max(1000).optional(),
  agent_notes: z.string().max(500).optional(),
});

// PATCH - Update offer status (accept/reject/counter)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`offers-patch:${ip}`);
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

    const parsed = updateOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, counter_amount, counter_message, agent_notes } = parsed.data;
    const serviceRole = createServiceRoleClient();

    // Get the offer
    const { data: offer, error: offerError } = await serviceRole
      .from("property_offers")
      .select("*, properties(title)")
      .eq("id", id)
      .maybeSingle();

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Verify user belongs to this office (or is super_admin)
    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "super_admin" && profile.office_id !== offer.office_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the offer
    const updateData: Record<string, unknown> = { status };
    if (agent_notes !== undefined) updateData.agent_notes = agent_notes;

    if (status === "countered") {
      if (!counter_amount) {
        return NextResponse.json({ error: "Counter amount required" }, { status: 400 });
      }
      updateData.counter_amount = counter_amount;
      updateData.counter_message = counter_message || null;
    }

    const { error: updateError } = await serviceRole
      .from("property_offers")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      logger.error("Failed to update offer", { error: updateError.message });
      return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
    }

    // If accepted, update property status to "reserved"
    if (status === "accepted") {
      const { error: propError } = await serviceRole
        .from("properties")
        .update({ status: "reserved", updated_at: new Date().toISOString() })
        .eq("id", offer.property_id);

      if (propError) {
        logger.error("Failed to update property status", { error: propError.message });
      }
    }

    // Send email notification to offerer (fire-and-forget)
    if (offer.offerer_email) {
      const { isEmailEnabled } = await import("@/lib/email/config");
      if (isEmailEnabled()) {
        const { sendEmail } = await import("@/lib/email/send");
        const formatPrice = (p: number) => new Intl.NumberFormat("ar-EG").format(p) + " EGP";
        const propertyTitle = (offer.properties as Record<string, unknown>)?.title || "Property";

        let subject = "";
        let html = "";

        if (status === "accepted") {
          subject = `تم قبول عرضك على ${propertyTitle}`;
          html = `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#22c55e;">تم قبول عرضك!</h2><p>تم قبول عرضك بقيمة <strong>${formatPrice(Number(offer.offer_amount))}</strong> على العقار <strong>${propertyTitle}</strong>.</p><p>سي التواصل معك المكتب قريباً.</p></div>`;
        } else if (status === "rejected") {
          subject = `تم رفض عرضك على ${propertyTitle}`;
          html = `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#ef4444;">تم رفض عرضك</h2><p>لم يتم قبول عرضك بقيمة <strong>${formatPrice(Number(offer.offer_amount))}</strong> على العقار <strong>${propertyTitle}</strong>.</p></div>`;
        } else if (status === "countered" && counter_amount) {
          subject = `عرض مضاد على ${propertyTitle}`;
          html = `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#1B2D4F;">عرض مضاد</h2><p>عرض مضاد بقيمة <strong>${formatPrice(counter_amount)}</strong> على العقار <strong>${propertyTitle}</strong> (عرضك: ${formatPrice(Number(offer.offer_amount))}).</p>${counter_message ? `<p>${counter_message}</p>` : ""}</div>`;
        }

        if (subject) {
          sendEmail({ to: offer.offerer_email, subject, html }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Offer update error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

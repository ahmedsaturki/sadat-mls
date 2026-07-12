import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const updateReferralSchema = z.object({
  status: z.enum(["pending", "contacted", "offer_submitted", "deal_closed", "expired", "cancelled"]),
});

// PATCH - Update referral status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`referrals-patch:${ip}`);
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

    const body = await request.json();
    const parsed = updateReferralSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const serviceRole = createServiceRoleClient();

    // Verify user has access to this referral
    const { data: referral } = await serviceRole
      .from("referrals")
      .select("id, referring_office_id, referred_office_id")
      .eq("id", id)
      .single();

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    const { data: profile } = await serviceRole
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const isInvolved = profile?.office_id === referral.referring_office_id ||
      profile?.office_id === referral.referred_office_id;

    if (!isSuperAdmin && !isInvolved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await serviceRole
      .from("referrals")
      .update({ status: parsed.data.status })
      .eq("id", id);

    if (error) {
      logger.error("Failed to update referral", { error: error.message });
      return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
    }

    // Log activity
    const { logActivity } = await import("@/lib/utils/activity-logger");
    await logActivity({
      userId: user.id,
      officeId: profile?.office_id,
      action: "referral.status_updated",
      entityType: "referral",
      entityId: id,
      metadata: { newStatus: parsed.data.status },
      ipAddress: ip,
      supabase: serviceRole,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Referral update error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

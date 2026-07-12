import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const createReferralSchema = z.object({
  referred_office_id: z.string().uuid(),
  client_name: z.string().min(1).max(100),
  client_email: z.string().email().optional().nullable(),
  client_phone: z.string().max(50).optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// GET - List referrals for current user's office
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`referrals-get:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // "sent" or "received"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    let query = supabase
      .from("referrals")
      .select(`
        *,
        referring_office:offices!referrals_referring_office_id_fkey(name, slug),
        referred_office:offices!referrals_referred_office_id_fkey(name, slug),
        property:properties(title, price),
        offer:property_offers(offer_amount, status),
        commission:property_commissions(total_commission, status)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (profile.role !== "super_admin") {
      if (type === "sent") {
        query = query.eq("referring_office_id", profile.office_id);
      } else if (type === "received") {
        query = query.eq("referred_office_id", profile.office_id);
      } else {
        query = query.or(`referring_office_id.eq.${profile.office_id},referred_office_id.eq.${profile.office_id}`);
      }
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: referrals, error } = await query;

    if (error) {
      logger.error("Failed to fetch referrals", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
    }

    // Get stats
    const statsQuery = profile.role === "super_admin"
      ? supabase.from("referrals").select("id, status, created_at")
      : supabase.from("referrals").select("id, status, created_at").or(`referring_office_id.eq.${profile.office_id},referred_office_id.eq.${profile.office_id}`);

    const { data: allReferrals } = await statsQuery;

    const stats = {
      total: allReferrals?.length || 0,
      pending: allReferrals?.filter((r) => r.status === "pending").length || 0,
      contacted: allReferrals?.filter((r) => r.status === "contacted").length || 0,
      offerSubmitted: allReferrals?.filter((r) => r.status === "offer_submitted").length || 0,
      dealClosed: allReferrals?.filter((r) => r.status === "deal_closed").length || 0,
      thisMonth: allReferrals?.filter((r) => {
        const d = new Date(r.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length || 0,
    };

    return NextResponse.json({ referrals: referrals || [], stats });
  } catch (err) {
    logger.error("Referrals fetch error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a referral
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`referrals-post:${ip}`);
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

    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.office_id && profile.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createReferralSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const serviceRole = createServiceRoleClient();
    const data = parsed.data;

    // Verify referred office exists
    const { data: referredOffice } = await serviceRole
      .from("offices")
      .select("id, name")
      .eq("id", data.referred_office_id)
      .single();

    if (!referredOffice) {
      return NextResponse.json({ error: "Referred office not found" }, { status: 404 });
    }

    // Get referring office's referral code
    const { data: referringOffice } = await serviceRole
      .from("offices")
      .select("id, referral_code")
      .eq("id", profile.office_id)
      .single();

    const { data: referral, error } = await serviceRole
      .from("referrals")
      .insert({
        referring_office_id: profile.office_id,
        referred_office_id: data.referred_office_id,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        property_id: data.property_id,
        notes: data.notes,
        referral_code_used: referringOffice?.referral_code || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create referral", { error: error.message });
      return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
    }

    // Log activity
    const { logActivity } = await import("@/lib/utils/activity-logger");
    await logActivity({
      userId: user.id,
      officeId: profile.office_id,
      action: "referral.created",
      entityType: "referral",
      entityId: referral.id,
      entityTitle: `Referral to ${referredOffice.name}`,
      metadata: { referredOffice: referredOffice.name, clientName: data.client_name },
      ipAddress: ip,
      supabase: serviceRole,
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    logger.error("Referral creation error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

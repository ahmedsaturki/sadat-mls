import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

// GET - List commissions for current user's office
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`commissions-get:${ip}`);
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
    const period = searchParams.get("period") || "all";

    let query = supabase
      .from("property_commissions")
      .select("*, properties(title), offices!property_commissions_listing_office_id_fkey(name), offices!property_commissions_referring_office_id_fkey(name)")
      .order("created_at", { ascending: false });

    // Super admin sees all, office members see their office only
    if (profile.role !== "super_admin") {
      query = query.or(`listing_office_id.eq.${profile.office_id},referring_office_id.eq.${profile.office_id}`);
    }

    // Date filter
    if (period === "month") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      query = query.gte("created_at", monthStart.toISOString());
    } else if (period === "quarter") {
      const quarterStart = new Date();
      quarterStart.setMonth(quarterStart.getMonth() - 3);
      query = query.gte("created_at", quarterStart.toISOString());
    }

    const { data: commissions, error } = await query;

    if (error) {
      logger.error("Failed to fetch commissions", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 });
    }

    // Calculate summary stats
    const totalCommission = (commissions || []).reduce((sum, c) => sum + Number(c.total_commission), 0);
    const pendingCommission = (commissions || []).filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.total_commission), 0);
    const paidCommission = (commissions || []).filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.total_commission), 0);

    return NextResponse.json({
      commissions: commissions || [],
      summary: {
        total: totalCommission,
        pending: pendingCommission,
        paid: paidCommission,
        count: (commissions || []).length,
      },
    });
  } catch (err) {
    logger.error("Commissions API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

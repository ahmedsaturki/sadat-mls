import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET - Office analytics with agent performance and conversion funnel
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`analytics-office:${ip}`);
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

    if (!profile?.office_id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const officeId = profile.office_id;
    const isSuperAdmin = profile.role === "super_admin";

    // Parallel queries for all metrics
    const [agentsResult, propertiesResult, contactsResult, offersResult, commissionsResult, referralsResult] = await Promise.all([
      // 1. Agents in this office
      supabase
        .from("users")
        .select("id, full_name, email, avatar_url, created_at, is_active")
        .eq("office_id", officeId)
        .eq("role", "office_agent"),

      // 2. All properties for this office
      supabase
        .from("properties")
        .select("id, created_by, status, price, area, created_at, updated_at")
        .eq("office_id", officeId)
        .eq("is_active", true),

      // 3. Contact requests for this office's properties
      supabase
        .from("contact_requests")
        .select("id, property_id, status, created_at")
        .eq("office_id", officeId),

      // 4. Offers on this office's properties
      supabase
        .from("property_offers")
        .select("id, property_id, offer_amount, status, created_at")
        .eq("office_id", officeId),

      // 5. Commissions for this office
      supabase
        .from("property_commissions")
        .select("id, agent_id, sale_amount, total_commission, listing_share, referring_share, status, created_at")
        .eq("listing_office_id", officeId),

      // 6. Referrals involving this office
      supabase
        .from("referrals")
        .select("id, referring_office_id, referred_office_id, status, created_at")
        .or(`referring_office_id.eq.${officeId},referred_office_id.eq.${officeId}`),
    ]);

    const agents = agentsResult.data || [];
    const properties = propertiesResult.data || [];
    const contacts = contactsResult.data || [];
    const offers = offersResult.data || [];
    const commissions = commissionsResult.data || [];
    const referrals = referralsResult.data || [];

    // --- Agent Performance ---
    const agentPerformance = agents.map((agent) => {
      const agentProperties = properties.filter((p) => p.created_by === agent.id);
      const agentCommissions = commissions.filter((c) => c.agent_id === agent.id);

      // Properties by status
      const totalListings = agentProperties.length;
      const available = agentProperties.filter((p) => p.status === "available").length;
      const sold = agentProperties.filter((p) => p.status === "sold").length;
      const rented = agentProperties.filter((p) => p.status === "rented").length;
      const reserved = agentProperties.filter((p) => p.status === "reserved").length;

      // Contact requests on agent's listings
      const agentPropertyIds = new Set(agentProperties.map((p) => p.id));
      const agentContacts = contacts.filter((c) => c.property_id && agentPropertyIds.has(c.property_id));

      // Offers on agent's listings
      const agentOffers = offers.filter((o) => agentPropertyIds.has(o.property_id));
      const acceptedOffers = agentOffers.filter((o) => o.status === "accepted");

      // Commissions
      const totalCommission = agentCommissions.reduce((sum, c) => sum + Number(c.total_commission), 0);
      const paidCommission = agentCommissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.total_commission), 0);
      const pendingCommission = agentCommissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.total_commission), 0);

      // Total sale value
      const totalSaleValue = agentCommissions.reduce((sum, c) => sum + Number(c.sale_amount), 0);

      // Conversion rate (contacts → offers → deals)
      const contactToOfferRate = agentContacts.length > 0 ? (agentOffers.length / agentContacts.length) * 100 : 0;
      const offerToDealRate = agentOffers.length > 0 ? (acceptedOffers.length / agentOffers.length) * 100 : 0;

      // Average days to sell
      const soldProperties = agentProperties.filter((p) => p.status === "sold" && p.updated_at);
      const avgDaysToSell = soldProperties.length > 0
        ? soldProperties.reduce((sum, p) => {
            const created = new Date(p.created_at).getTime();
            const updated = new Date(p.updated_at).getTime();
            return sum + (updated - created) / (1000 * 60 * 60 * 24);
          }, 0) / soldProperties.length
        : 0;

      return {
        id: agent.id,
        name: agent.full_name || agent.email?.split("@")[0] || "Agent",
        email: agent.email,
        avatarUrl: agent.avatar_url,
        isActive: agent.is_active,
        joinedAt: agent.created_at,
        listings: { total: totalListings, available, sold, rented, reserved },
        contacts: agentContacts.length,
        offers: { total: agentOffers.length, accepted: acceptedOffers.length },
        commission: { total: totalCommission, paid: paidCommission, pending: pendingCommission },
        totalSaleValue,
        conversionRates: { contactToOffer: contactToOfferRate, offerToDeal: offerToDealRate },
        avgDaysToSell: Math.round(avgDaysToSell),
      };
    });

    // Sort by total commission descending
    agentPerformance.sort((a, b) => b.commission.total - a.commission.total);

    // --- Conversion Funnel ---
    const totalProperties = properties.length;
    const totalContacts = contacts.length;
    const totalOffers = offers.length;
    const acceptedOffers = offers.filter((o) => o.status === "accepted").length;
    const pendingOffers = offers.filter((o) => o.status === "pending").length;
    const rejectedOffers = offers.filter((o) => o.status === "rejected").length;
    const totalCommissionsValue = commissions.reduce((sum, c) => sum + Number(c.total_commission), 0);
    const paidCommissionsValue = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.total_commission), 0);

    const funnel = {
      properties: totalProperties,
      contacts: totalContacts,
      offers: totalOffers,
      acceptedOffers,
      pendingOffers,
      rejectedOffers,
      totalCommission: totalCommissionsValue,
      paidCommission: paidCommissionsValue,
      contactToOfferRate: totalContacts > 0 ? (totalOffers / totalContacts) * 100 : 0,
      offerToAcceptRate: totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0,
      overallConversion: totalContacts > 0 ? (acceptedOffers / totalContacts) * 100 : 0,
    };

    // --- Referral Stats ---
    const sentReferrals = referrals.filter((r) => r.referring_office_id === officeId);
    const receivedReferrals = referrals.filter((r) => r.referred_office_id === officeId);
    const closedReferrals = referrals.filter((r) => r.status === "deal_closed");

    // --- Monthly Trends (last 6 months) ---
    const now = new Date();
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = monthDate.toISOString().slice(0, 7);

      const monthProperties = properties.filter((p) => {
        const d = new Date(p.created_at);
        return d >= monthDate && d <= monthEnd;
      }).length;

      const monthContacts = contacts.filter((c) => {
        const d = new Date(c.created_at);
        return d >= monthDate && d <= monthEnd;
      }).length;

      const monthOffers = offers.filter((o) => {
        const d = new Date(o.created_at);
        return d >= monthDate && d <= monthEnd;
      }).length;

      const monthDeals = offers.filter((o) => {
        const d = new Date(o.created_at);
        return d >= monthDate && d <= monthEnd && o.status === "accepted";
      }).length;

      monthlyTrends.push({
        month: monthStr,
        properties: monthProperties,
        contacts: monthContacts,
        offers: monthOffers,
        deals: monthDeals,
      });
    }

    return NextResponse.json({
      agentPerformance,
      funnel,
      referrals: {
        sent: sentReferrals.length,
        received: receivedReferrals.length,
        closed: closedReferrals.length,
      },
      monthlyTrends,
    });
  } catch (err) {
    logger.error("Office analytics error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

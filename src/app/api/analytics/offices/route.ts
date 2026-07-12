import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET - Office comparison data (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`analytics-offices:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = createServiceRoleClient();

    // Get all active offices
    const { data: offices, error: officesError } = await supabase
      .from("offices")
      .select("id, name, slug, description, logo_url, created_at")
      .eq("is_active", true)
      .order("name");

    if (officesError || !offices?.length) {
      return NextResponse.json({ offices: [] });
    }

    // Parallel queries for each office's stats
    const officeStats = await Promise.all(
      offices.map(async (office) => {
        const [propertiesResult, agentsResult, contactsResult, offersResult, commissionsResult] = await Promise.all([
          supabase
            .from("properties")
            .select("id, status, price")
            .eq("office_id", office.id)
            .eq("is_active", true),
          supabase
            .from("users")
            .select("id")
            .eq("office_id", office.id)
            .eq("role", "office_agent")
            .eq("is_active", true),
          supabase
            .from("contact_requests")
            .select("id, status")
            .eq("office_id", office.id),
          supabase
            .from("property_offers")
            .select("id, offer_amount, status")
            .eq("office_id", office.id),
          supabase
            .from("property_commissions")
            .select("id, total_commission, status, sale_amount")
            .eq("listing_office_id", office.id),
        ]);

        const properties = propertiesResult.data || [];
        const agents = agentsResult.data || [];
        const contacts = contactsResult.data || [];
        const offers = offersResult.data || [];
        const commissions = commissionsResult.data || [];

        const totalMarketValue = properties.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const avgPrice = properties.length > 0 ? totalMarketValue / properties.length : 0;
        const avgArea = properties.length > 0
          ? properties.reduce((sum, p) => sum + (Number(p.price) > 0 ? 1 : 0), 0) / properties.length
          : 0;

        return {
          id: office.id,
          name: office.name,
          slug: office.slug,
          description: office.description,
          logoUrl: office.logo_url,
          createdAt: office.created_at,
          stats: {
            properties: {
              total: properties.length,
              available: properties.filter((p) => p.status === "available").length,
              sold: properties.filter((p) => p.status === "sold").length,
              rented: properties.filter((p) => p.status === "rented").length,
            },
            agents: agents.length,
            contacts: {
              total: contacts.length,
              pending: contacts.filter((c) => c.status === "pending").length,
            },
            offers: {
              total: offers.length,
              accepted: offers.filter((o) => o.status === "accepted").length,
              totalValue: offers.reduce((sum, o) => sum + Number(o.offer_amount || 0), 0),
            },
            commissions: {
              total: commissions.reduce((sum, c) => sum + Number(c.total_commission || 0), 0),
              paid: commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.total_commission || 0), 0),
              saleValue: commissions.reduce((sum, c) => sum + Number(c.sale_amount || 0), 0),
            },
            totalMarketValue,
            avgPrice: Math.round(avgPrice),
          },
        };
      })
    );

    return NextResponse.json({ offices: officeStats });
  } catch (err) {
    logger.error("Office comparison error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

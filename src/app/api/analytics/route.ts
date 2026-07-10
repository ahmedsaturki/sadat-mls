import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const officeId = request.nextUrl.searchParams.get("officeId");
    if (!officeId) {
      return NextResponse.json({ error: "officeId required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Parallel queries for analytics
    const [propertiesResult, favoritesResult, contactsResult] = await Promise.all([
      // Total properties by status
      supabase
        .from("properties")
        .select("id, status, title")
        .eq("office_id", officeId),
      // Favorites per property
      supabase
        .from("property_favorites")
        .select("property_id")
        .in("property_id", (
          // Get property IDs for this office first
          await supabase.from("properties").select("id").eq("office_id", officeId)
        ).data?.map((p: { id: string }) => p.id) || []),
      // Contact requests for this office
      supabase
        .from("contact_requests")
        .select("id, property_id, contact_type, created_at")
        .eq("office_id", officeId),
    ]);

    const properties = propertiesResult.data || [];
    const favorites = favoritesResult.data || [];
    const contacts = contactsResult.data || [];

    // Calculate analytics
    const totalProperties = properties.length;
    const byStatus = {
      available: properties.filter((p: { status: string }) => p.status === "available").length,
      reserved: properties.filter((p: { status: string }) => p.status === "reserved").length,
      sold: properties.filter((p: { status: string }) => p.status === "sold").length,
      rented: properties.filter((p: { status: string }) => p.status === "rented").length,
    };

    // Favorites per property
    const favoritesPerProperty: Record<string, number> = {};
    for (const fav of favorites) {
      const pid = (fav as { property_id: string }).property_id;
      favoritesPerProperty[pid] = (favoritesPerProperty[pid] || 0) + 1;
    }

    // Top properties by favorites
    const topProperties = properties
      .map((p: { id: string; title: string }) => ({
        id: p.id,
        title: p.title,
        favorites: favoritesPerProperty[p.id] || 0,
      }))
      .sort((a: { favorites: number }, b: { favorites: number }) => b.favorites - a.favorites)
      .slice(0, 5);

    // Contact requests by type
    const contactsByType: Record<string, number> = {};
    for (const c of contacts) {
      const ct = (c as { contact_type: string }).contact_type;
      contactsByType[ct] = (contactsByType[ct] || 0) + 1;
    }

    // Recent contacts
    const recentContacts = contacts
      .sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    return NextResponse.json({
      totalProperties,
      byStatus,
      totalFavorites: favorites.length,
      topProperties,
      contactsByType,
      totalContacts: contacts.length,
      recentContacts,
    });
  } catch (err) {
    logger.error("Analytics error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

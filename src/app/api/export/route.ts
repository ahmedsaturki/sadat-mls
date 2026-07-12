import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { ROLES } from "@/lib/utils/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`export-get:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Authenticate user via RLS-aware client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for ownership check
    const { data: userProfile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!userProfile?.office_id && userProfile?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: "No office associated" }, { status: 403 });
    }

    const officeId = request.nextUrl.searchParams.get("officeId");
    const type = request.nextUrl.searchParams.get("type") || "properties";

    if (!officeId) {
      return NextResponse.json({ error: "officeId required" }, { status: 400 });
    }

    // Ownership check: non-super-admin can only export their own office data
    if (userProfile?.role !== ROLES.SUPER_ADMIN && userProfile?.office_id !== officeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service-role client for data queries (RLS applies but we've verified ownership)
    const supabaseAdmin = createServiceRoleClient();

    if (type === "properties") {
      const { data: properties, error } = await supabaseAdmin
        .from("properties")
        .select("id, title, description, price, area, bedrooms, bathrooms, status, street, created_at, updated_at, property_types(name_ar, name_en), zones(name_ar, name_en)")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to export properties", { error: error.message });
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
      }

      const rows = (properties || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        price: p.price,
        area: p.area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        status: p.status,
        street: p.street || "",
        type_ar: (p.property_types as Record<string, string> | null)?.name_ar || "",
        type_en: (p.property_types as Record<string, string> | null)?.name_en || "",
        zone_ar: (p.zones as Record<string, string> | null)?.name_ar || "",
        zone_en: (p.zones as Record<string, string> | null)?.name_en || "",
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      const csv = generateCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=properties.csv",
        },
      });
    }

    if (type === "contacts") {
      const { data: contacts, error } = await supabaseAdmin
        .from("contact_requests")
        .select("id, visitor_name, visitor_email, visitor_phone, contact_type, message, status, created_at")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to export contacts", { error: error.message });
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
      }

      const csv = generateCsv(contacts || []);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=contacts.csv",
        },
      });
    }

    if (type === "agents") {
      const { data: agents, error } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name, phone, role, is_active, created_at")
        .eq("office_id", officeId)
        .eq("role", "office_agent")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to export agents", { error: error.message });
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
      }

      const rows = (agents || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        email: a.email,
        full_name: a.full_name || "",
        phone: a.phone || "",
        is_active: a.is_active ? "Active" : "Inactive",
        created_at: a.created_at,
      }));

      const csv = generateCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=agents.csv",
        },
      });
    }

    if (type === "referrals") {
      const { data: referrals, error } = await supabaseAdmin
        .from("referrals")
        .select(`
          id, client_name, client_email, client_phone, status, notes, referral_code_used, created_at,
          referring_office:offices!referrals_referring_office_id_fkey(name),
          referred_office:offices!referrals_referred_office_id_fkey(name)
        `)
        .or(`referring_office_id.eq.${officeId},referred_office_id.eq.${officeId}`)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to export referrals", { error: error.message });
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
      }

      const rows = (referrals || []).map((r: Record<string, unknown>) => ({
        id: r.id,
        client_name: r.client_name,
        client_email: r.client_email || "",
        client_phone: r.client_phone || "",
        referring_office: (r.referring_office as Record<string, string> | null)?.name || "",
        referred_office: (r.referred_office as Record<string, string> | null)?.name || "",
        status: r.status,
        referral_code_used: r.referral_code_used || "",
        notes: r.notes || "",
        created_at: r.created_at,
      }));

      const csv = generateCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=referrals.csv",
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (err) {
    logger.error("Export error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          // Escape CSV special characters
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(","),
    ),
  ];

  return "\uFEFF" + csvRows.join("\n"); // BOM for Excel UTF-8 support
}

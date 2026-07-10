import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const officeId = request.nextUrl.searchParams.get("officeId");
    const type = request.nextUrl.searchParams.get("type") || "properties";

    if (!officeId) {
      return NextResponse.json({ error: "officeId required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (type === "properties") {
      const { data: properties, error } = await supabase
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
      const { data: contacts, error } = await supabase
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

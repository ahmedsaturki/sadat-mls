import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const PROPERTY_COLUMNS =
  "id, title, description, property_type, transaction_type, status, city, district, neighborhood, address, latitude, longitude, area_m2, bedrooms, bathrooms, floor, finishing, price, currency, features, confidence, first_seen_at, last_seen_at, created_at, updated_at, parcel_number, installments_clear, canonical_key" as const;

const DEFAULT_LIMIT = 48;

type SortMode = "newest" | "price_low" | "price_high" | "area";

function firstParam(value: string | null): string {
  return value?.trim() ?? "";
}

function escapeIlike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function parseNumber(value: string, name: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}`);
  }
  return parsed;
}

function parseSort(value: string): SortMode {
  if (value === "price_low" || value === "price_high" || value === "area") return value;
  return "newest";
}

export async function GET(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const rate = await checkApiRateLimit(`properties-get:${ip}`, undefined, {
    maxRequests: 60,
    windowMs: 60 * 1000,
  });

  if (rate.unavailable) {
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable" },
      { status: 503, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rate.headers },
    );
  }

  try {
    const params = request.nextUrl.searchParams;
    const queryText = firstParam(params.get("q"));
    const propertyType = firstParam(params.get("type"));
    const district = firstParam(params.get("district"));
    const minPrice = parseNumber(firstParam(params.get("minPrice")), "minPrice");
    const maxPrice = parseNumber(firstParam(params.get("maxPrice")), "maxPrice");
    const minArea = parseNumber(firstParam(params.get("minArea")), "minArea");
    const maxArea = parseNumber(firstParam(params.get("maxArea")), "maxArea");
    const sortBy = parseSort(firstParam(params.get("sort")));

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return NextResponse.json({ error: "minPrice cannot exceed maxPrice" }, { status: 400 });
    }
    if (minArea !== null && maxArea !== null && minArea > maxArea) {
      return NextResponse.json({ error: "minArea cannot exceed maxArea" }, { status: 400 });
    }
    if (queryText.length > 120 || propertyType.length > 120 || district.length > 120) {
      return NextResponse.json({ error: "Filter value is too long" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("properties")
      .select(PROPERTY_COLUMNS, { count: "exact" })
      .eq("status", "active");

    if (queryText) {
      const escaped = escapeIlike(queryText.replace(/[(),]/g, " "));
      query = query.or(
        `title.ilike.%${escaped}%,description.ilike.%${escaped}%,district.ilike.%${escaped}%,neighborhood.ilike.%${escaped}%`,
      );
    }
    if (propertyType) query = query.eq("property_type", propertyType);
    if (district) query = query.eq("district", district);
    if (minPrice !== null) query = query.gte("price", minPrice);
    if (maxPrice !== null) query = query.lte("price", maxPrice);
    if (minArea !== null) query = query.gte("area_m2", minArea);
    if (maxArea !== null) query = query.lte("area_m2", maxArea);

    switch (sortBy) {
      case "price_low":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "price_high":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "area":
        query = query.order("area_m2", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, count, error } = await query.range(0, DEFAULT_LIMIT - 1);
    if (error) {
      return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
    }

    return NextResponse.json(
      { properties: data ?? [], count: count ?? 0 },
      {
        status: 200,
        headers: {
          ...rate.headers,
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load properties";
    const status = message.startsWith("Invalid ") ? 400 : 500;
    return NextResponse.json({ error: status === 400 ? message : "Failed to load properties" }, { status });
  }
}

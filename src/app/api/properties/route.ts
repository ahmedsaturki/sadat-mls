import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { createPublicReadClient } from "@/lib/supabase/public-read";

export const runtime = "nodejs";

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

    const supabase = createPublicReadClient();
    const result = await supabase.rpc("get_public_active_properties", {
      p_query: queryText || null,
      p_property_type: propertyType || null,
      p_district: district || null,
      p_min_price: minPrice,
      p_max_price: maxPrice,
      p_min_area: minArea,
      p_max_area: maxArea,
      p_sort: sortBy,
      p_limit: DEFAULT_LIMIT,
      p_offset: 0,
    });

    if (result.error) {
      return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
    }

    return NextResponse.json(
      { properties: result.data ?? [], count: result.data?.[0]?.total_count ?? 0 },
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

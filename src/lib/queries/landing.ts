import { createPublicReadClient } from "@/lib/supabase/public-read";
import type { Database } from "@/lib/supabase/types";
import { logger } from "@/lib/logger";

export type LandingProperty = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  | "id"
  | "title"
  | "description"
  | "price"
  | "area_m2"
  | "bedrooms"
  | "bathrooms"
  | "property_type"
  | "status"
  | "city"
  | "district"
  | "neighborhood"
> & {
  primaryImage: string | null;
};

interface LandingData {
  properties: LandingProperty[];
  officesCount: number | null;
  propertiesCount: number;
  zonesCount: number | null;
}

const FEATURED_COLUMNS =
  "id, title, description, price, area_m2, bedrooms, bathrooms, property_type, status, city, district, neighborhood";

function sanitizeSearchTerm(value: string): string {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ");
}

export async function getLandingData(searchQuery?: string): Promise<LandingData> {
  try {
    const supabase = createPublicReadClient();
    const propertiesQuery = supabase
      .from("properties")
      .select(FEATURED_COLUMNS, { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6);

    const q =
      searchQuery && searchQuery.trim().length > 0
        ? sanitizeSearchTerm(searchQuery)
        : null;

    const finalPropertiesQuery = q
      ? propertiesQuery.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`,
        )
      : propertiesQuery;

    const { data: properties, count, error } = await finalPropertiesQuery;

    if (error) {
      logger.error("Failed to load landing properties", { error: error.message });
      return {
        properties: [],
        officesCount: null,
        propertiesCount: 0,
        zonesCount: null,
      };
    }

    const featured: LandingProperty[] = (properties ?? []).map((property) => ({
      ...property,
      primaryImage: null,
    }));

    return {
      properties: featured,
      officesCount: null,
      propertiesCount: count ?? 0,
      zonesCount: null,
    };
  } catch (error) {
    logger.error("Landing data query failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      properties: [],
      officesCount: null,
      propertiesCount: 0,
      zonesCount: null,
    };
  }
}

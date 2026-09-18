import { createPublicReadClient } from "@/lib/supabase/public-read";
import type { Database } from "@/lib/supabase/types";

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

type FeaturedRow = Omit<LandingProperty, "primaryImage">;

function sanitizeSearchTerm(value: string): string {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ");
}

export async function getLandingData(searchQuery?: string): Promise<LandingData> {
  try {
    const supabase = createPublicReadClient();
    const q = searchQuery && searchQuery.trim().length > 0 ? sanitizeSearchTerm(searchQuery) : null;
    const finalPropertiesQuery = q
      ? propertiesQuery.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`,
        )
      : propertiesQuery;

    const { data: properties, error: propertiesError } = await finalPropertiesQuery;
    const featured: LandingProperty[] = (properties ?? []).map((property) => ({
      ...property,
      primaryImage: null,
    }));

    return {
      properties: featured,
      officesCount: null,
      propertiesCount: 0,
      zonesCount: null,
    };
  } catch {
    return { properties: [], officesCount: null, propertiesCount: 0, zonesCount: null };
  }
}

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
    const q = searchQuery?.trim() ? sanitizeSearchTerm(searchQuery) : null;
    const { data, error } = await supabase.rpc("get_public_active_properties", {
      p_query: q,
      p_limit: 6,
      p_offset: 0,
      p_sort: "newest",
    });

    if (error) throw error;

    const featured: LandingProperty[] = (data ?? []).map((property) => ({
      ...property,
      primaryImage: null,
    }));

    return {
      properties: featured,
      officesCount: null,
      propertiesCount: data?.[0]?.total_count ?? 0,
      zonesCount: null,
    };
  } catch {
    return { properties: [], officesCount: null, propertiesCount: 0, zonesCount: null };
  }
}

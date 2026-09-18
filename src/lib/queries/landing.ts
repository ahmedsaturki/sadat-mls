import { createClient } from "@/lib/supabase/server";
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

const FEATURED_COLUMNS =
  "id, title, description, price, area_m2, bedrooms, bathrooms, property_type, status, city, district, neighborhood";

type FeaturedRow = Omit<LandingProperty, "primaryImage">;

function sanitizeSearchTerm(value: string): string {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ");
}

export async function getLandingData(searchQuery?: string): Promise<LandingData> {
  try {
    const supabase = await createClient();

    let propertiesQuery = supabase
      .from("properties")
      .select(FEATURED_COLUMNS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6);

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = sanitizeSearchTerm(searchQuery);
      propertiesQuery = propertiesQuery.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`,
      );
    }

    const typedPropertiesQuery = propertiesQuery.overrideTypes<FeaturedRow[], { merge: false }>();

    const [{ data: properties, error: propertiesError }, propertiesCountRes] = await Promise.all([
      typedPropertiesQuery,
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    if (propertiesError) throw propertiesError;
    if (propertiesCountRes.error) throw propertiesCountRes.error;

    const featured: LandingProperty[] = (properties ?? []).map((property) => ({
      ...property,
      primaryImage: null,
    }));

    return {
      properties: featured,
      officesCount: null,
      propertiesCount: propertiesCountRes.count ?? 0,
      zonesCount: null,
    };
  } catch {
    return { properties: [], officesCount: null, propertiesCount: 0, zonesCount: null };
  }
}

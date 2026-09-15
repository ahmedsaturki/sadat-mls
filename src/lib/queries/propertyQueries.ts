import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type PropertyForComparison = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  zone: string | null;
  type: string | null;
  officeName: string | null;
  status: string | null;
  primaryImage: string | null;
};

type AqaratComparisonRow = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  status: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
};

const COMPARISON_COLUMNS =
  "id, title, description, price, area_m2, bedrooms, bathrooms, property_type, status, city, district, neighborhood";

export async function getPropertyByIds(ids: string[]): Promise<PropertyForComparison[]> {
  if (ids.length === 0) return [];

  try {
    const supabase = await createClient();

    const { data: properties, error } = await supabase
      .from("properties")
      .select(COMPARISON_COLUMNS)
      .in("id", ids)
      .eq("status", "active")
      .overrideTypes<AqaratComparisonRow[], { merge: false }>();

    if (error) throw error;

    return (properties ?? []).map((prop) => ({
      id: prop.id,
      title: prop.title ?? "Property",
      description: prop.description,
      price: prop.price,
      area: prop.area_m2,
      bedrooms: prop.bedrooms ?? 0,
      bathrooms: prop.bathrooms ?? 0,
      zone: [prop.district, prop.neighborhood].filter(Boolean).join(" · ") || null,
      type: prop.property_type,
      // Aqarat OS currently has no authoritative office/media relation in the property contract.
      officeName: null,
      status: prop.status,
      primaryImage: null,
    }));
  } catch (err) {
    logger.error("Error fetching properties for comparison", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    throw new Error("Failed to load properties");
  }
}

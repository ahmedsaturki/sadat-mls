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

type RawPropertyRow = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  property_types: { name_ar: string; name_en: string }[] | null;
  zones: { name_ar: string; name_en: string }[] | null;
  offices: { name: string }[] | null;
};

export async function getPropertyByIds(ids: string[]): Promise<PropertyForComparison[]> {
  if (ids.length === 0) return [];

  try {
    const supabase = await createClient();

    const { data: properties, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        title,
        description,
        price,
        area,
        bedrooms,
        bathrooms,
        status,
        property_types!property_types_id(name_ar, name_en),
        zones!properties_zone_id_fkey(name_ar, name_en),
        offices!properties_office_id_fkey(name)
      `
      )
      .in("id", ids)
      .eq("status", "available")
      .eq("is_active", true);

    if (error) throw error;

    const rawRows = (properties || []) as unknown as RawPropertyRow[];

    const { data: images, error: imagesError } = await supabase
      .from("property_images")
      .select("property_id, url")
      .in("property_id", ids)
      .eq("is_primary", true);

    if (imagesError) throw imagesError;

    const imageMap = new Map<string, string>(
      (images || []).map((img) => [img.property_id, img.url])
    );

    return rawRows.map((prop) => {
      const typeRow = prop.property_types?.[0] ?? null;
      const zoneRow = prop.zones?.[0] ?? null;
      const officeRow = prop.offices?.[0] ?? null;
      return {
        id: prop.id,
        title: prop.title,
        description: prop.description,
        price: prop.price,
        area: prop.area,
        bedrooms: prop.bedrooms ?? 0,
        bathrooms: prop.bathrooms ?? 0,
        zone: zoneRow?.name_ar || zoneRow?.name_en || null,
        type: typeRow?.name_ar || typeRow?.name_en || null,
        officeName: officeRow?.name || null,
        status: prop.status,
        primaryImage: imageMap.get(prop.id) || null,
      };
    });
  } catch (err) {
    logger.error("Error fetching properties for comparison", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    throw new Error("Failed to load properties");
  }
}

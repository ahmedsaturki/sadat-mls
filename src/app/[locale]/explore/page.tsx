import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/explore/ExploreClient";

export const revalidate = 3600; // ISR: revalidate every 1 hour

const PROPERTY_COLUMNS = "id, title, description, price, area, bedrooms, bathrooms, status, zone_id, property_type_id, office_id, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name)";
const PAGE_SIZE = 12;

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch initial properties (first page, available + active)
  const { data: properties, count, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS, { count: "exact" })
    .eq("status", "available")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    console.error("Failed to load explore properties:", error.message);
  }

  // Fetch zones, types, developers, projects, offices for filters
  const [{ data: zonesData }, { data: typesData }, { data: developersData }, { data: projectsData }, { data: officesData }] = await Promise.all([
    supabase.from("zones").select("id, name_ar, name_en"),
    supabase.from("property_types").select("id, name_ar, name_en"),
    supabase.from("developers").select("id, name").eq("is_active", true).order("name"),
    supabase.from("projects").select("id, title, developer_id").eq("is_active", true).order("title"),
    supabase.from("offices").select("id, name").eq("is_active", true).order("name"),
  ]);

  // Fetch primary images for initial properties
  const propertyIds = properties?.map((p: { id: string }) => p.id) || [];
  let imageMap = new Map<string, string>();
  if (propertyIds.length > 0) {
    const { data: images } = await supabase
      .from("property_images")
      .select("property_id, url")
      .in("property_id", propertyIds)
      .eq("is_primary", true);

    imageMap = new Map(
      (images || []).map((img: { property_id: string; url: string }) => [img.property_id, img.url])
    );
  }

  // Format zones and types with locale
  const formattedZones = (zonesData || []).map((z: { id: string; name_ar: string; name_en: string | null }) => ({
    id: z.id,
    name: locale === "ar" ? z.name_ar : (z.name_en || z.name_ar),
  }));

  const formattedTypes = (typesData || []).map((t: { id: string; name_ar: string; name_en: string | null }) => ({
    id: t.id,
    name: locale === "ar" ? t.name_ar : (t.name_en || t.name_ar),
  }));

  // Format properties with images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedProperties = (properties || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    street: p.street,
    price: p.price,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    status: p.status,
    zone_id: p.zone_id,
    property_type_id: p.property_type_id,
    office_id: p.office_id,
    property_types: p.property_types,
    zones: p.zones,
    offices: p.offices,
    primaryImage: imageMap.get(p.id as string) || null,
  }));

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ExploreClient
        params={{ locale }}
        initialProperties={formattedProperties}
        initialCount={count || 0}
        initialZones={formattedZones}
        initialTypes={formattedTypes}
        initialDevelopers={(developersData || []).map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))}
        initialProjects={(projectsData || []).map((p: { id: string; title: string; developer_id: string }) => ({ id: p.id, name: p.title, developer_id: p.developer_id }))}
        initialOffices={(officesData || []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name }))}
      />
    </Suspense>
  );
}

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getServerAuth } from "@/lib/supabase/server-auth";
import PropertiesDashboardClient from "@/components/dashboard/PropertiesDashboardClient";
import { PropertyCardSkeletonGrid } from "@/components/properties/PropertyCardSkeleton";

const PROPERTY_COLUMNS = "id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, is_active, office_id, created_at, property_types(name_ar, name_en), zones(name_ar, name_en)";
const PAGE_SIZE = 9;

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale as Locale)) {
    notFound();
  }

  const { user } = await getServerAuth();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const supabase = await createClient();

  // Get user profile for office_id and role
  const { data: profile } = await supabase
    .from("users")
    .select("office_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.office_id) {
    redirect(`/${locale}/explore`);
  }

  // Fetch initial properties (first page)
  const [propertiesResult, officeResult, statsResults] = await Promise.all([
    supabase
      .from("properties")
      .select(PROPERTY_COLUMNS, { count: "exact" })
      .eq("office_id", profile.office_id)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase.from("offices").select("name").eq("id", profile.office_id).maybeSingle(),
    Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.office_id).eq("status", "available"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.office_id).eq("status", "sold"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.office_id).eq("status", "rented"),
    ]),
  ]);

  // Fetch primary images for initial properties
  const propertyIds = (propertiesResult.data || []).map((p: { id: string }) => p.id);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedProperties = (propertiesResult.data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    status: p.status,
    zone_id: p.zone_id,
    property_type_id: p.property_type_id,
    created_at: p.created_at,
    property_types: p.property_types,
    zones: p.zones,
    primaryImage: imageMap.get(p.id as string) || null,
  }));

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <PropertyCardSkeletonGrid count={6} />
        </div>
      </div>
    }>
      <PropertiesDashboardClient
        locale={locale}
        initialProperties={formattedProperties}
        initialCount={propertiesResult.count || 0}
        initialOfficeName={officeResult.data?.name || ""}
        initialStats={{
          available: statsResults[0].count || 0,
          sold: statsResults[1].count || 0,
          rented: statsResults[2].count || 0,
        }}
        userRole={profile.role}
        userId={user.id}
        officeId={profile.office_id}
      />
    </Suspense>
  );
}

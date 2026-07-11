import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/i18n/getMessages";
import type { Metadata } from "next";
import OfficeProfileClient from "@/components/office/OfficeProfileClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale as Locale)) return {};

  const supabase = await createClient();
  const { data: office } = await supabase
    .from("offices")
    .select("name, description, address")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!office) {
    return { title: "Office Not Found" };
  }

  const desc = office.description || `${office.name} - ${office.address || "Sadat City"}`;

  return {
    title: office.name,
    description: desc,
    openGraph: {
      title: office.name,
      description: desc,
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
  };
}

export default async function OfficePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLocale(locale as Locale)) {
    notFound();
  }

  const dict = getMessages(locale as Locale);
  const supabase = await createClient();

  const { data: office } = await supabase
    .from("offices")
    .select("id, name, slug, email, phone, address, description, logo_url, is_active, created_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!office) {
    notFound();
  }

  // Fetch office properties
  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, price, area, bedrooms, bathrooms, status, created_at, property_types(name_ar, name_en), zones(name_ar, name_en)")
    .eq("office_id", office.id)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch primary images
  const propertyIds = (properties || []).map((p: { id: string }) => p.id);
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

  // Fetch agents count and stats
  const [agentsResult, statsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, avatar_url")
      .eq("office_id", office.id)
      .neq("role", "super_admin"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("office_id", office.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedProperties = (properties || []).map((p: any) => ({
    id: p.id as string,
    title: p.title as string,
    price: p.price as number,
    area: p.area as number,
    bedrooms: p.bedrooms as number,
    bathrooms: p.bathrooms as number,
    status: p.status as string,
    property_types: p.property_types,
    zones: p.zones,
    primaryImage: imageMap.get(p.id as string) || null,
  }));

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
      </div>
    }>
      <OfficeProfileClient
        locale={locale}
        office={office}
        properties={formattedProperties}
        agents={agentsResult.data || []}
        totalCount={statsResult.count || 0}
      />
    </Suspense>
  );
}

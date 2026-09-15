import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/explore/ExploreClient";

export const revalidate = 300;

const PROPERTY_COLUMNS = [
  "id",
  "title",
  "description",
  "property_type",
  "transaction_type",
  "status",
  "city",
  "district",
  "neighborhood",
  "address",
  "latitude",
  "longitude",
  "area_m2",
  "bedrooms",
  "bathrooms",
  "floor",
  "finishing",
  "price",
  "currency",
  "features",
  "confidence",
  "first_seen_at",
  "last_seen_at",
  "created_at",
  "updated_at",
  "parcel_number",
  "installments_clear",
  "canonical_key",
].join(", ");

const PAGE_SIZE = 12;

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: properties, count, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS, { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    console.error("Failed to load Aqarat OS properties:", error.message);
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ExploreClient
        params={{ locale }}
        initialProperties={properties ?? []}
        initialCount={count ?? 0}
      />
    </Suspense>
  );
}

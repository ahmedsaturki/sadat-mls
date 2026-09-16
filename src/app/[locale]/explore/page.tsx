import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isValidLocale } from "@/i18n/config";
import type { Database } from "@/lib/supabase/types";
import AqaratExploreClient, { type AqaratProperty } from "@/components/explore/AqaratExploreClient";

export const revalidate = 300;

const PROPERTY_COLUMNS =
  "id, title, description, property_type, transaction_type, status, city, district, neighborhood, address, latitude, longitude, area_m2, bedrooms, bathrooms, floor, finishing, price, currency, features, confidence, first_seen_at, last_seen_at, created_at, updated_at, parcel_number, installments_clear, canonical_key";

const PAGE_SIZE = 12;

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let properties: AqaratProperty[] = [];
  let count = 0;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Failed to load Aqarat OS properties: service role configuration is missing");
  } else {
    const supabase = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const result = await supabase
      .from("properties")
      .select(PROPERTY_COLUMNS, { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (result.error) {
      console.error("Failed to load Aqarat OS properties:", result.error.message);
    } else {
      properties = (result.data ?? []) as AqaratProperty[];
      count = result.count ?? 0;
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AqaratExploreClient
        params={{ locale }}
        initialProperties={properties}
        initialCount={count}
      />
    </Suspense>
  );
}

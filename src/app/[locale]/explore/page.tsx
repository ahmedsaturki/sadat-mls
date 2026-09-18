import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { createPublicReadClient } from "@/lib/supabase/public-read";
import AqaratExploreClient, { type AqaratProperty } from "@/components/explore/AqaratExploreClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  let properties: AqaratProperty[] = [];
  let count = 0;

  try {
    const supabase = createPublicReadClient();
    const { data, error } = await supabase.rpc("get_public_active_properties", {
      p_limit: PAGE_SIZE,
      p_offset: 0,
      p_sort: "newest",
    });

    if (error) {
      console.error("Failed to load Aqarat OS properties:", error.message);
    } else {
      properties = (data ?? []) as AqaratProperty[];
      count = data?.[0]?.total_count ?? 0;
    }
  } catch (error) {
    console.error("Failed to load Aqarat OS properties:", error);
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

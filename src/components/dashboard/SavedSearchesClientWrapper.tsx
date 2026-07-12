"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const SavedSearchesClient = dynamic(() => import("./SavedSearchesClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function SavedSearchesClientWrapper({
  params,
}: {
  params: { locale: string };
}) {
  return <SavedSearchesClient params={params} />;
}

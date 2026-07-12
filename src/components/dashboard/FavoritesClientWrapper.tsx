"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const FavoritesClient = dynamic(() => import("./FavoritesClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function FavoritesClientWrapper({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  return <FavoritesClient params={params} />;
}

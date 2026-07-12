"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const OffersClient = dynamic(() => import("./OffersClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function OffersClientWrapper({
  params,
}: {
  params: { locale: string };
}) {
  return <OffersClient params={params} />;
}

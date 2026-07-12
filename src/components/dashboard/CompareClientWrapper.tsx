"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const CompareClient = dynamic(() => import("./CompareClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function CompareClientWrapper({
  params,
}: {
  params: { locale: string };
}) {
  return <CompareClient params={params} />;
}

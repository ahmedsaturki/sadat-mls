"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const CommissionsClient = dynamic(() => import("./CommissionsClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function CommissionsClientWrapper({
  params,
}: {
  params: { locale: string };
}) {
  return <CommissionsClient params={params} />;
}

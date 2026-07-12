"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const MessagesClient = dynamic(() => import("./MessagesClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function MessagesClientWrapper({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  return <MessagesClient params={params} />;
}

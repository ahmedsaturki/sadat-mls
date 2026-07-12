"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const SettingsClient = dynamic(() => import("./SettingsClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function SettingsClientWrapper({
  params,
}: {
  params: { locale: string };
}) {
  return <SettingsClient params={params} />;
}

"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const NotificationsClient = dynamic(() => import("./NotificationsClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <LuxuryLoader />
    </div>
  ),
});

export default function NotificationsClientWrapper({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  return <NotificationsClient params={params} />;
}

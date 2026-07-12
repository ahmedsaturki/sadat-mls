"use client";

import dynamic from "next/dynamic";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const ContactRequestsClient = dynamic(
  () => import("./ContactRequestsClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <LuxuryLoader />
      </div>
    ),
  }
);

export default function ContactRequestsClientWrapper({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  return <ContactRequestsClient params={params} />;
}

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const SettingsClient = dynamic(() => import("@/components/dashboard/SettingsClient"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-20"><LuxuryLoader /></div>,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return {
    title: dict.nav.settings,
    description: dict.auth.platformSubtitle,
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SettingsClient params={{ locale }} />;
}

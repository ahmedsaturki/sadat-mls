import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { getServerAuth } from "@/lib/supabase/server-auth";
import CommissionsClientWrapper from "@/components/dashboard/CommissionsClientWrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return { title: dict.dashboard.commissions };
}

export default async function CommissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);
  return <CommissionsClientWrapper params={{ locale }} />;
}

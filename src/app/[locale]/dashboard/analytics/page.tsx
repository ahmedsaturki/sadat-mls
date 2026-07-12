import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { getServerAuth } from "@/lib/supabase/server-auth";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale || "ar";
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  return {
    title: dict.analytics.title,
    description: dict.analytics.description,
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    redirect("/ar");
  }

  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);

  const auth = await getServerAuth();
  if (!auth) {
    redirect(`/${locale}/login`);
  }

  return <AnalyticsDashboard locale={typedLocale} dict={dict} />;
}

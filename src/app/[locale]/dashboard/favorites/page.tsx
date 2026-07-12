import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { getServerAuth } from "@/lib/supabase/server-auth";
import FavoritesClientWrapper from "@/components/dashboard/FavoritesClientWrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return { title: dict.common.favorites, description: dict.auth.platformSubtitle };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale as Locale)) redirect("/ar");
  const { user } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);
  return <FavoritesClientWrapper params={{ locale, userId: user.id }} />;
}

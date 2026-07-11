import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { getServerAuth } from "@/lib/supabase/server-auth";
import AdminZonesClient from "@/components/admin/AdminZonesClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  return { title: getMessages(locale).nav.zones };
}

export default async function AdminZonesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);
  return <AdminZonesClient params={{ locale }} />;
}

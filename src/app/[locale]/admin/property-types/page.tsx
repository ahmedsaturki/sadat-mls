import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { getServerAuth } from "@/lib/supabase/server-auth";
import AdminPropertyTypesClient from "@/components/admin/AdminPropertyTypesClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  return { title: getMessages(locale).nav.propertyTypes };
}

export default async function AdminPropertyTypesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);
  return <AdminPropertyTypesClient params={{ locale }} />;
}

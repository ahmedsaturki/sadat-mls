import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompareOfficesClient from "@/components/investors/CompareOfficesClient";

export const revalidate = 3600;

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
    title: dict.investor.compareOffices,
    description: dict.investor.compareOfficesDescription,
  };
}

export default async function CompareOfficesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return null;
  }

  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar locale={typedLocale} dict={dict} />
      <div className="pt-20">
        <CompareOfficesClient locale={typedLocale} dict={dict} />
      </div>
      <Footer locale={typedLocale} dict={dict} />
    </main>
  );
}

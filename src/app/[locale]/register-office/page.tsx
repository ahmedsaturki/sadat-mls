import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import RegisterOfficeClient from "@/components/auth/RegisterOfficeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return { title: dict.nav.registerOffice };
}

export default async function RegisterOfficePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterOfficeClient params={{ locale }} />;
}

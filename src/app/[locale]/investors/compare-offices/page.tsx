import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function CompareOfficesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");

  // Historical office-comparison analytics are not backed by the current
  // authoritative Aqarat OS contract. Keep the route fail-closed.
  redirect(`/${locale}/explore`);
}

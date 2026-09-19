import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function SavedSearchesPage({
  params,
}: {
  params: Promise<{ locale: string }>,
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Durable saved searches require an authoritative persistence, ownership,
  // and notification contract that is not present in the current schema.
  redirect(`/${locale}/explore`);
}

import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function CommissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Historical commission persistence is not backed by the current
  // authoritative Aqarat OS contract. Keep the route fail-closed.
  redirect(`/${locale}/explore`);
}

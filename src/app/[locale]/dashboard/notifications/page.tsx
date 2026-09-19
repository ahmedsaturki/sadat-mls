import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Historical notification persistence is not backed by a verified Aqarat
  // OS contract. Keep the route fail-closed.
  redirect(`/${locale}/explore`);
}

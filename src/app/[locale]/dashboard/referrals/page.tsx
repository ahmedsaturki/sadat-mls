import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ locale: string }>,
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Historical office-referral persistence is not backed by a verified
  // Aqarat OS organization contract. Keep this surface retired.
  redirect(`/${locale}/explore`);
}

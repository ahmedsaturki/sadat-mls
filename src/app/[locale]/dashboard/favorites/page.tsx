import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Favorites require an authoritative Auth↔people identity and ownership
  // contract that is not present in the current Aqarat OS schema.
  redirect(`/${locale}/explore`);
}

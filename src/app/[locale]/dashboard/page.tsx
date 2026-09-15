import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { getServerAuth } from "@/lib/supabase/server-auth";

export default async function OfficeDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const { user } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);

  // Office-scoped dashboard data still depends on the retired offices/users
  // contract. Do not emulate it with unverifiable Aqarat mappings.
  redirect(`/${locale}/explore`);
}

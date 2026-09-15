import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { getServerAuth } from "@/lib/supabase/server-auth";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const { user, profile } = await getServerAuth();
  if (!user) redirect(`/${locale}/login`);

  // The verified Aqarat OS contract does not yet contain the Auth → people
  // authorization mapping required to safely expose the legacy admin model.
  // Keep the route fail-closed until that contract is explicitly established.
  if (!profile?.role) redirect(`/${locale}/dashboard`);
  redirect(`/${locale}/dashboard`);
}

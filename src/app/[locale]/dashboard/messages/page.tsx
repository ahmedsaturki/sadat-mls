import { redirect } from "next/navigation";
import { isValidLocale } from "@/i18n/config";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect("/ar");
  // Historical inter-user messaging is not backed by a verified Aqarat OS
  // contract. Do not execute the retired client/API surface.
  redirect(`/${locale}/explore`);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import InvitationAcceptClient from "@/components/auth/InvitationAcceptClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale || "ar";
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  return {
    title: dict.invitation.acceptInvitation,
    description: dict.invitation.acceptInvitationDescription,
  };
}

export default async function InvitationAcceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);

  if (!token) {
    notFound();
  }

  return <InvitationAcceptClient locale={typedLocale} dict={dict} token={token} />;
}

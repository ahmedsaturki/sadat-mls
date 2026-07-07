import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundaryWrapper from "@/components/ui/ErrorBoundaryWrapper";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    title: dict.office.dashboard,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/dashboard`,
      languages: {
        ar: `${baseUrl}/ar/dashboard`,
        en: `${baseUrl}/en/dashboard`,
      },
    },
  };
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";

  const dict = getMessages(validLocale);

  return (
    <AuthGuard locale={validLocale}>
      <ErrorBoundaryWrapper
        fallbackTitle={dict.auth.dashboardError}
        fallbackMessage={dict.auth.dashboardErrorMessage}
      >
        {children}
      </ErrorBoundaryWrapper>
    </AuthGuard>
  );
}
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundaryWrapper from "@/components/ui/ErrorBoundaryWrapper";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: dict.office.dashboard || "Office Dashboard",
    alternates: {
      canonical: `${baseUrl}/${validLocale}/dashboard`,
      languages: {
        "ar": `${baseUrl}/ar/dashboard`,
        "en": `${baseUrl}/en/dashboard`,
      },
    },
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dict = getMessages("ar");

  return (
    <AuthGuard>
      <ErrorBoundaryWrapper
        fallbackTitle={dict.auth.dashboardError}
        fallbackMessage={dict.auth.dashboardErrorMessage}
      >
        {children}
      </ErrorBoundaryWrapper>
    </AuthGuard>
  );
}

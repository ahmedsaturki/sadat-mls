import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundaryWrapper from "@/components/ui/ErrorBoundaryWrapper";
import { ROLES } from "@/lib/utils/constants";

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
    metadataBase: new URL(baseUrl),
    title: dict.admin.dashboard,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/admin`,
      languages: {
        "ar": `${baseUrl}/ar/admin`,
        "en": `${baseUrl}/en/admin`,
      },
    },
  };
}

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);

  return (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
      <ErrorBoundaryWrapper fallbackTitle={dict.admin.errorTitle} fallbackMessage={dict.admin.errorMessage}>
        {children}
      </ErrorBoundaryWrapper>
    </AuthGuard>
  );
}

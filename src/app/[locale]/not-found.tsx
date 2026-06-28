import Link from "next/link";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";

export default async function LocaleNotFound({
  params,
}: {
  params: { locale: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const rawLocale = resolvedParams?.locale || "ar";
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ar";
  const dict = getMessages(locale);
  const notFoundTitle = dict.common?.notFound || "Page Not Found";
  const notFoundDesc = dict.common?.notFoundDesc || "The page you are looking for does not exist or has been moved.";
  const backToHome = dict.common?.backToHome || "Back to Home";

  const isRtl = locale === "ar";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {notFoundTitle}
        </h2>
        <p className="text-gray-500 mb-6">{notFoundDesc}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          {isRtl ? (
            <ArrowLeft className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
          {backToHome}
        </Link>
      </div>
    </div>
  );
}

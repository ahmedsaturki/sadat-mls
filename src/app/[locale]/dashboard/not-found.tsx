import Link from "next/link";
import { LayoutDashboard, ArrowRight } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";

interface PageProps {
  params: { locale: string };
}

export default function DashboardNotFound({ params }: PageProps) {
  const locale = params?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);

  return (
    <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-300 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{dict.common.notFound}</h2>
        <p className="text-gray-500 mb-4">{dict.common.pageNotFound}</p>
        <Link
          href={`/${validLocale}/dashboard`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {dict.common.backToDashboard}
        </Link>
      </div>
    </div>
  );
}

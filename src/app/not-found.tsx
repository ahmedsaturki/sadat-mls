"use client";

import Link from "next/link";
import { Building2, Home, Search } from "lucide-react";

const messages = {
  ar: {
    title: "الصفحة غير موجودة",
    description: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.",
    home: "الرئيسية",
    explore: "استكشاف العقارات",
    hint: "أو تحقق من صحة الرابط والمحاولة مرة أخرى",
  },
  en: {
    title: "Page not found",
    description: "Sorry, the page you are looking for does not exist or has been moved.",
    home: "Home",
    explore: "Explore Properties",
    hint: "Or check the URL and try again",
  },
};

export default function NotFound() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const locale = path.startsWith("/en") ? "en" : "ar";
  const msg = messages[locale as keyof typeof messages] || messages.ar;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-6xl font-bold text-blue-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{msg.title}</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {msg.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            {msg.home}
          </Link>
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            {msg.explore}
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            {msg.hint}
          </p>
        </div>
      </div>
    </div>
  );
}

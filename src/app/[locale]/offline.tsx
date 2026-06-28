"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [locale, setLocale] = useState("ar");

  useEffect(() => {
    const path = window.location.pathname;
    setLocale(path.startsWith("/en") ? "en" : "ar");
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {locale === "ar" ? "أنت غير متصل بالإنترنت" : "You are offline"}
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {locale === "ar"
            ? "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
            : "Please check your internet connection and try again."}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          {locale === "ar" ? "إعادة المحاولة" : "Try Again"}
        </button>
      </div>
    </div>
  );
}

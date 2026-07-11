"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import enDict from "@/i18n/messages/en.json";
import arDict from "@/i18n/messages/ar.json";

const TRANSLATIONS = {
  ar: {
    title: arDict.offline.title,
    message: arDict.offline.description,
    retry: arDict.offline.tryAgain,
    dir: "rtl" as const,
  },
  en: {
    title: enDict.offline.title,
    message: enDict.offline.description,
    retry: enDict.offline.tryAgain,
    dir: "ltr" as const,
  },
} as const;

export default function OfflinePage() {
  const [locale, setLocale] = useState<keyof typeof TRANSLATIONS>("ar");

  useEffect(() => {
    const path = window.location.pathname;
    setLocale(path.startsWith("/en") ? "en" : "ar");
  }, []);

  const t = TRANSLATIONS[locale];

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={t.dir}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {t.title}
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {t.message}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 bg-navy-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          {t.retry}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState("ar");

  useEffect(() => {
    Sentry.captureException(error);
    const path = window.location.pathname;
    setLocale(path.startsWith("/en") ? "en" : "ar");
  }, [error]);

  const messages = {
    ar: {
      title: "حدث خطأ",
      description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      retry: "المحاولة مرة أخرى",
      home: "العودة للرئيسية",
    },
    en: {
      title: "Something went wrong",
      description: "An unexpected error occurred. Please try again.",
      retry: "Try again",
      home: "Go to home",
    },
  };

  const msg = messages[locale as keyof typeof messages] || messages.ar;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{msg.title}</h1>
        <p className="text-gray-500 mb-6">{msg.description}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {msg.retry}
          </button>
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowRight className={`w-5 h-5 ${locale === "ar" ? "rotate-180" : ""}`} />
            {msg.home}
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { LuxuryErrorBoundary } from "@/components/shared/LuxuryErrorBoundary";

function detectLocale(): { lang: string; dir: "rtl" | "ltr" } {
  if (typeof window === "undefined") return { lang: "ar", dir: "rtl" };
  const path = window.location.pathname;
  const match = path.match(/^\/(ar|en)(\/|$)/);
  const locale = match?.[1] || "ar";
  return { lang: locale, dir: locale === "ar" ? "rtl" : "ltr" };
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [{ lang, dir }, setLocale] = useState(detectLocale);

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  return (
    <html lang={lang} dir={dir}>
      <body>
        <LuxuryErrorBoundary error={error} reset={reset} />
      </body>
    </html>
  );
}

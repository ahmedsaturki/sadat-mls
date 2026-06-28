"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
      title: "حدث خطأ غير متوقع",
      description: "نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.",
      retry: "المحاولة مرة أخرى",
    },
    en: {
      title: "Something went wrong",
      description: "We apologize for the error. Please try again.",
      retry: "Try again",
    },
  };

  const msg = messages[locale as keyof typeof messages] || messages.ar;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "Cairo, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "5rem",
              height: "5rem",
              backgroundColor: "#fee2e2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>⚠</span>
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
              color: "#111827",
            }}
          >
            {msg.title}
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            {msg.description}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            {msg.retry}
          </button>
        </div>
      </body>
    </html>
  );
}

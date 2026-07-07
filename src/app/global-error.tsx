"use client";

import { LuxuryErrorBoundary } from "@/components/shared/LuxuryErrorBoundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LuxuryErrorBoundary error={error} reset={reset} />
      </body>
    </html>
  );
}

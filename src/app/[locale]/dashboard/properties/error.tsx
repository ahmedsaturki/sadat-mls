"use client";

import { LuxuryErrorBoundary } from "@/components/shared/LuxuryErrorBoundary";

export default function PropertiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <LuxuryErrorBoundary error={error} reset={reset} />;
}

"use client";

import { LuxuryErrorBoundary } from "@/components/shared/LuxuryErrorBoundary";

export default function PropertyTypesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <LuxuryErrorBoundary error={error} reset={reset} />;
}

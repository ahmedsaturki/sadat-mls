"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Dashboard page error", { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-gray-500">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

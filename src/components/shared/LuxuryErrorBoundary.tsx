"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";
import { getMessages } from "@/i18n/getMessages";

interface LuxuryErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
}

export function LuxuryErrorBoundary({
  error,
  reset,
}: LuxuryErrorBoundaryProps) {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const dict = getMessages(locale);

  useEffect(() => {
    logger.error("LuxuryErrorBoundary caught error", { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" role="alert">
      <div
        className="animate-scale-up max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[#1B2D4F] to-[#1B2D4F]/80 p-8 flex flex-col items-center text-center">
          <div
            className="animate-fade-up w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
          >
            <AlertTriangle className="w-8 h-8 text-[#C49A2A]" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {dict.common.oops}
          </h2>
          <p className="text-white/70 mb-6">
            {dict.common.unexpectedError}
          </p>
          
          <button
            onClick={reset}
            className="group flex items-center justify-center gap-2 w-full bg-[#C49A2A] text-[#1B2D4F] px-6 py-3 rounded-xl font-semibold hover:bg-[#C49A2A]/90 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#C49A2A]/50 focus:outline-none shadow-lg shadow-[#C49A2A]/20 hover:shadow-xl hover:shadow-[#C49A2A]/30"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
            {dict.common.retry}
           </button>
        </div>
        
{process.env.NODE_ENV === "development" && (
           <div className="p-4 bg-gray-50 border-t border-gray-100 overflow-auto max-h-48 text-xs text-gray-700 font-mono">
             <p className="font-semibold text-[#1B2D4F] mb-1">{dict.common.developerErrorInfo}</p>
             {error.message}
           </div>
         )}
      </div>
    </div>
  );
}

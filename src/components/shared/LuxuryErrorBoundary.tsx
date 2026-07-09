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
        <div className="bg-gradient-to-br from-navy-800 to-navy-800/80 p-8 flex flex-col items-center text-center">
          <div
            className="animate-fade-up w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
          >
            <AlertTriangle className="w-8 h-8 text-gold-500" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {dict.common.oops}
          </h2>
          <p className="text-white/70 mb-6">
            {dict.common.unexpectedError}
          </p>
          
          <button
            onClick={reset}
            className="group flex items-center justify-center gap-2 w-full bg-gold-500 text-navy-800 px-6 py-3 rounded-xl font-semibold hover:bg-gold-600 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-gold-500/50 focus:outline-none shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/30"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
            {dict.common.retry}
           </button>
        </div>
        
{process.env.NODE_ENV === "development" && (
           <div className="p-4 bg-gray-50 border-t border-gray-100 overflow-auto max-h-48 text-xs text-gray-700 font-mono">
             <p className="font-semibold text-navy-800 mb-1">{dict.common.developerErrorInfo}</p>
             {error.message}
           </div>
         )}
      </div>
    </div>
  );
}

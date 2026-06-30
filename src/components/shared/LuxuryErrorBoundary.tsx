"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

interface LuxuryErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function LuxuryErrorBoundary({ error, reset }: LuxuryErrorBoundaryProps) {
  useEffect(() => {
    logger.error("LuxuryErrorBoundary caught error", { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[#1B2D4F] to-[#1B2D4F]/80 p-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
          >
            <AlertTriangle className="w-8 h-8 text-[#C49A2A]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Oops!
          </h2>
          <p className="text-white/70 mb-6">
            An unexpected error has occurred. Please try again.
          </p>
          
          <button
            onClick={reset}
            className="group flex items-center justify-center gap-2 w-full bg-[#C49A2A] text-[#1B2D4F] px-6 py-3 rounded-xl font-semibold hover:bg-[#C49A2A]/90 transition-all duration-300 focus:ring-2 focus:ring-[#C49A2A]/50 focus:outline-none shadow-lg shadow-[#C49A2A]/20 hover:shadow-xl hover:shadow-[#C49A2A]/30"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Try again
          </button>
        </div>
        
        {process.env.NODE_ENV === "development" && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 overflow-auto max-h-48 text-xs text-gray-700 font-mono">
            <p className="font-semibold text-[#1B2D4F] mb-1">Developer Error Info:</p>
            {error.message}
          </div>
        )}
      </motion.div>
    </div>
  );
}

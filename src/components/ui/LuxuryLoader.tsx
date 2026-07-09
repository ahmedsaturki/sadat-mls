"use client";

import { Sparkles } from "lucide-react";

interface LuxuryLoaderProps {
  fullScreen?: boolean;
  text?: string;
  locale?: string;
}

export function LuxuryLoader({ fullScreen = false, text, locale = "ar" }: LuxuryLoaderProps) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center w-full p-8 ${fullScreen ? "min-h-screen bg-gray-50" : "min-h-[400px]"}`}>
      <div className="animate-pulse-scale w-16 h-16 rounded-full bg-navy-800/10 flex items-center justify-center mb-6 relative">
        <div className="animate-spin-slow absolute inset-0 rounded-full border-t-2 border-r-2 border-gold-500 opacity-70" />
        <Sparkles className="w-6 h-6 text-navy-800" aria-hidden="true" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="animate-fade-in h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div className="animate-bar-slide h-full w-1/2 bg-gold-500 rounded-full" />
        </div>
        <p className={`text-sm font-medium text-gray-500 mt-2 ${locale === "en" ? "tracking-widest uppercase" : ""}`}>{text}</p>
      </div>
    </div>
  );
}

export default LuxuryLoader;

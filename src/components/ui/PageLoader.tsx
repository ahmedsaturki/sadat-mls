"use client";

import { Sparkles } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface PageLoaderProps {
  variant?: "spinner" | "luxury" | "fullscreen";
  text?: string;
  fullScreen?: boolean;
  loadingText?: string;
  ariaBusy?: string;
  role?: string;
}

export function PageLoader({ variant = "luxury", text, fullScreen = false, loadingText = "Loading...", ariaBusy, role }: PageLoaderProps) {
  if (variant === "spinner") {
    return (
      <LoadingSpinner size="lg" text={text} />
    );
  }

  if (variant === "fullscreen" || fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm" aria-busy={ariaBusy === "true"} role={role || "status"} aria-live="polite">
        <div className="animate-pulse-scale w-16 h-16 rounded-full bg-[#1B2D4F]/10 flex items-center justify-center mb-6 relative">
          <div className="animate-spin-slow absolute inset-0 rounded-full border-t-2 border-r-2 border-[#C49A2A] opacity-70" />
          <Sparkles className="w-6 h-6 text-[#1B2D4F]" aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="animate-fade-in h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
            <div className="animate-bar-slide h-full w-1/2 bg-[#C49A2A] rounded-full" />
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-widest uppercase mt-2">{text || loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full p-8 min-h-[400px]" role="status" aria-busy="true">
      <div className="animate-pulse-scale w-16 h-16 rounded-full bg-[#1B2D4F]/10 flex items-center justify-center mb-6 relative">
        <div className="animate-spin-slow absolute inset-0 rounded-full border-t-2 border-r-2 border-[#C49A2A] opacity-70" />
        <Sparkles className="w-6 h-6 text-[#1B2D4F]" aria-hidden="true" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="animate-fade-in h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div className="animate-bar-slide h-full w-1/2 bg-[#C49A2A] rounded-full" />
        </div>
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase mt-2">{text || loadingText}</p>
      </div>
    </div>
  );
}

export default PageLoader;

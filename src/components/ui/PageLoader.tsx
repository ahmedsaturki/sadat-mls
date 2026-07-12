"use client";

import { Sparkles } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface PageLoaderProps {
  /** Visual variant: "spinner" (simple), "luxury" (branded, default), "fullscreen" (overlay) */
  variant?: "spinner" | "luxury" | "fullscreen";
  /** Optional text displayed below the loader */
  text?: string;
  /** Shorthand to force fullscreen overlay mode */
  fullScreen?: boolean;
  /** Alias for text (backward compat with LuxuryLoader) */
  loadingText?: string;
  /** Locale for RTL-aware text styling — "ar" (default) omits tracking-widest/uppercase */
  locale?: string;
  /** Accessibility: set aria-busy */
  ariaBusy?: string;
  /** Accessibility: override role attribute */
  role?: string;
}

/**
 * Standardized page-level loading component.
 *
 * Variants:
 * - "spinner": Simple border spinner via LoadingSpinner
 * - "luxury": Branded gold/navy spinner with animated progress bar (default)
 * - "fullscreen": Luxury variant as a fixed overlay covering the viewport
 *
 * For Skeleton-based content placeholders, use Skeleton/SkeletonCard/SkeletonTable instead.
 */
export function PageLoader({
  variant = "luxury",
  text,
  fullScreen = false,
  loadingText = "",
  locale = "ar",
  ariaBusy,
  role,
}: PageLoaderProps) {
  if (variant === "spinner") {
    return <LoadingSpinner size="lg" text={text} />;
  }

  const displayText = text || loadingText;

  // RTL-aware text styling: only apply tracking-widest uppercase for English
  const textClass =
    locale === "en"
      ? "text-sm font-medium text-gray-500 tracking-widest uppercase mt-2"
      : "text-sm font-medium text-gray-500 mt-2";

  if (variant === "fullscreen" || fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
        aria-busy={ariaBusy === "true"}
        role={role || "status"}
        aria-live="polite"
      >
        <div className="animate-pulse-scale w-16 h-16 rounded-full bg-navy-800/10 flex items-center justify-center mb-6 relative">
          <div className="animate-spin-slow absolute inset-0 rounded-full border-t-2 border-e-2 border-gold-500 opacity-70" />
          <Sparkles className="w-6 h-6 text-navy-800" aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="animate-fade-in h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
            <div className="animate-bar-slide h-full w-1/2 bg-gold-500 rounded-full" />
          </div>
          {displayText && <p className={textClass}>{displayText}</p>}
        </div>
      </div>
    );
  }

  // Default luxury variant (inline, not fullscreen)
  return (
    <div
      className="flex flex-col items-center justify-center w-full p-8 min-h-[400px]"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="animate-pulse-scale w-16 h-16 rounded-full bg-navy-800/10 flex items-center justify-center mb-6 relative">
        <div className="animate-spin-slow absolute inset-0 rounded-full border-t-2 border-e-2 border-gold-500 opacity-70" />
        <Sparkles className="w-6 h-6 text-navy-800" aria-hidden="true" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="animate-fade-in h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
          <div className="animate-bar-slide h-full w-1/2 bg-gold-500 rounded-full" />
        </div>
        {displayText && <p className={textClass}>{displayText}</p>}
      </div>
    </div>
  );
}

export default PageLoader;

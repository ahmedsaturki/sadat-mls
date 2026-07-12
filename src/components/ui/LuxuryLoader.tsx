"use client";

import { PageLoader } from "./PageLoader";

interface LuxuryLoaderProps {
  fullScreen?: boolean;
  text?: string;
  locale?: string;
}

/**
 * @deprecated Use PageLoader directly. This wrapper exists for backward compatibility.
 *
 * PageLoader is the standardized loading component. It includes the luxury variant
 * (gold/navy branded spinner with progress bar) as its default, plus "spinner" and
 * "fullscreen" variants.
 *
 * Migration: Replace `import { LuxuryLoader } from "@/components/ui/LuxuryLoader"`
 * with `import { PageLoader } from "@/components/ui/PageLoader"`
 * and change `<LuxuryLoader />` to `<PageLoader />`.
 */
export function LuxuryLoader({
  fullScreen = false,
  text,
  locale = "ar",
}: LuxuryLoaderProps) {
  return (
    <PageLoader
      variant={fullScreen ? "fullscreen" : "luxury"}
      text={text}
      fullScreen={fullScreen}
      locale={locale}
    />
  );
}

export default LuxuryLoader;

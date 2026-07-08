"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Syncs <html> lang and dir attributes with the URL locale segment.
 *
 * The root layout renders <html> with a server-detected default locale
 * (or fallback "ar"). This component corrects those attributes on the
 * client using the actual URL path, so both SSR and static generation
 * produce the right values.
 */
export default function HtmlAttributes() {
  const pathname = usePathname();

  useEffect(() => {
    const firstSegment = pathname?.split("/").filter(Boolean)[0];
    const locale = firstSegment === "en" ? "en" : "ar";
    const dir = locale === "en" ? "ltr" : "rtl";

    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [pathname]);

  return null;
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";

export function usePageLocale(params?: { locale: string } | Promise<{ locale: string }>): Locale {
  const urlParams = useParams();
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    // 1. Try URL params (most reliable for client components)
    if (urlParams?.locale && isValidLocale(urlParams.locale as string)) {
      setLocale(urlParams.locale as Locale);
      return;
    }

    // 2. Fallback to props
    if (!params) return;
    if (params instanceof Promise) {
      let cancelled = false;
      params.then((p) => {
        if (!cancelled && p?.locale && isValidLocale(p.locale)) {
          setLocale(p.locale as Locale);
        }
      });
      return () => { cancelled = true; };
    } else {
      if (params.locale && isValidLocale(params.locale)) {
        setLocale(params.locale as Locale);
      }
    }
  }, [urlParams, params]);

  return locale;
}

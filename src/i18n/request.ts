import { type Locale, defaultLocale } from "./config";
import { getMessages } from "./getMessages";

/**
 * Server-side request configuration for i18n.
 * This file provides server-side utilities for i18n configuration.
 */

/**
 * Get the locale from request headers or URL
 */
export function getLocaleFromRequest(
  pathname: string,
  acceptLanguage?: string
): Locale {
  // Check URL path first
  if (pathname.startsWith("/en")) {
    return "en";
  }

  // Check Accept-Language header
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
    if (preferred === "en") {
      return "en";
    }
  }

  return defaultLocale;
}

/**
 * Get messages for server-side rendering
 */
export function getServerMessages(locale: Locale) {
  return getMessages(locale);
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}

/**
 * Get the direction for a locale
 */
export function getDirection(locale: Locale): "rtl" | "ltr" {
  return isRTL(locale) ? "rtl" : "ltr";
}

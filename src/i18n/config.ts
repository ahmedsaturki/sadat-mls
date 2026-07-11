/**
 * i18n Configuration for Aqar Cloud
 *
 * To add a new language:
 * 1. Add the locale code to `locales` array below
 * 2. Create a new JSON file in `src/i18n/messages/{locale}.json`
 *   - Copy `en.json` as a template — all keys must match exactly
 * 3. Import the file in `src/i18n/getMessages.ts` and add to `messages` object
 * 4. Add the locale to `RTL_LOCALES` if it's RTL (e.g., Urdu, Farsi)
 * 5. Add the locale to `generateStaticParams()` in `src/app/[locale]/layout.tsx`
 * 6. Add locale label to `LOCALE_LABELS` below
 * 7. That's it — the rest of the system auto-adapts
 */

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const RTL_LOCALES: Locale[] = ["ar"];

/**
 * Human-readable labels for each locale (used in language switcher)
 */
export const LOCALE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
  // Add new locales here:
  // fr: "Français",
  // tr: "Türkçe",
  // ur: "اردو",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get the direction for a locale
 */
export function getDirection(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

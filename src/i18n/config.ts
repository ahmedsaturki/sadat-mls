export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const RTL_LOCALES: Locale[] = ["ar"];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

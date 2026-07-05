import { type Locale, defaultLocale } from "./config";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

const messages = { ar, en };

export function getMessages(locale: Locale = defaultLocale) {
  return messages[locale] || messages[defaultLocale];
}

/**
 * Type-safe messages type that mirrors the structure of both ar.json and en.json.
 * Both translation files must maintain identical key structures.
 */
export type Messages = typeof ar;

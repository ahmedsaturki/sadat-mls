import { type Locale, defaultLocale } from "./config";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

const messages = { ar, en };

export function getMessages(locale: Locale = defaultLocale) {
  return messages[locale] || messages[defaultLocale];
}

export type Messages = typeof ar & {
  propertyFeatures?: {
    balconyDescription?: string;
    parkingDescription?: string;
    elevatorDescription?: string;
    featureEnabled?: string;
    featureDisabled?: string;
    feature?: {
      balcony?: string;
      parking?: string;
      elevator?: string;
    };
  };
};

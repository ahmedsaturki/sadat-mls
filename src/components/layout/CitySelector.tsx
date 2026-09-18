"use client";

import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface CitySelectorProps {
  locale: Locale;
  dict: Messages;
  currentCity?: string;
}

export default function CitySelector({ locale: _locale, dict: _dict, currentCity: _currentCity }: CitySelectorProps) {
  // The previous selector depended on the retired `cities` relation.
  // Keep the component contract stable but render no selector until location
  // data is backed by the verified Aqarat OS contract.
  return null;
}

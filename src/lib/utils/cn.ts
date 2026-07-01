import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, locale: string = "ar"): string {
  const localeCode = locale === "en" ? "en-US" : "ar-EG";
  return new Intl.NumberFormat(localeCode, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price);
}

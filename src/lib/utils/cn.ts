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

export function formatDate(date: string | Date, locale: string = "ar"): string {
  const localeCode = locale === "en" ? "en-US" : "ar-EG";
  return new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

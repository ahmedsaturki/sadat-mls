export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

export function setStoredTheme(theme: Theme) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

export function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const effective = getEffectiveTheme(theme);
  document.documentElement.classList.toggle("dark", effective === "dark");
}

/**
 * Initialize theme from localStorage on page load.
 * Call this once in the root layout or Providers.
 */
export function initializeTheme() {
  const stored = getStoredTheme();
  applyTheme(stored);
  return stored;
}

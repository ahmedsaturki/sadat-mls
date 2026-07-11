"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredTheme, setStoredTheme, applyTheme, getEffectiveTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);

    // Listen for system preference changes when in system mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = getStoredTheme();
      if (current === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setStoredTheme(t);
    applyTheme(t);
  }, []);

  const effectiveTheme = mounted ? getEffectiveTheme(theme) : "light";

  return { theme, setTheme, effectiveTheme, mounted };
}

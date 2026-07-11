"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";

interface ThemeToggleProps {
  dict: { common: Record<string, string> };
}

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "lightMode" },
  { value: "dark", icon: Moon, labelKey: "darkMode" },
  { value: "system", icon: Monitor, labelKey: "systemMode" },
];

export default function ThemeToggle({ dict }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const currentOption = THEME_OPTIONS.find((o) => o.value === theme) || THEME_OPTIONS[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        aria-label={dict.common.darkMode}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute top-full end-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50"
          role="listbox"
          aria-label={dict.common.darkMode}
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={isActive}
                onClick={() => { setTheme(option.value); setIsOpen(false); }}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-navy-50 dark:bg-navy-900/30 text-navy-600 dark:text-navy-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {dict.common[option.labelKey] || option.labelKey}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

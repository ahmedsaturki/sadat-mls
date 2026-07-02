"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const container = containerRef.current;
      if (container) {
        const focusable = container.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  return { containerRef, handleKeyDown };
}

export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") callback();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}

export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = document.getElementById("a11y-announcer");
    if (el) {
      el.setAttribute("aria-live", priority);
      el.textContent = "";
      setTimeout(() => {
        el.textContent = message;
      }, 100);
    }
  }, []);

  return { announce };
}

export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement | null }>,
  options: {
    orientation?: "horizontal" | "vertical";
    onSelect?: (id: string) => void;
  } = {}
) {
  const { orientation = "vertical", onSelect } = options;
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key } = e;
      const isNext =
        orientation === "vertical" ? key === "ArrowDown" : key === "ArrowRight";
      const isPrev =
        orientation === "vertical" ? key === "ArrowUp" : key === "ArrowLeft";

      if (isNext) {
        e.preventDefault();
        const newIndex = (indexRef.current + 1) % items.length;
        indexRef.current = newIndex;
        setCurrentIndex(newIndex);
        items[newIndex]?.element?.focus();
      } else if (isPrev) {
        e.preventDefault();
        const newIndex = (indexRef.current - 1 + items.length) % items.length;
        indexRef.current = newIndex;
        setCurrentIndex(newIndex);
        items[newIndex]?.element?.focus();
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        onSelect?.(items[indexRef.current]?.id);
      }
    },
    [items, orientation, onSelect]
  );

  return { handleKeyDown, currentIndex };
}

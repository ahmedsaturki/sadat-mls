"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

interface TouchTargetOptions {
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

/**
 * Hook to ensure touch targets meet WCAG 2.1 AA requirements (44x44px minimum)
 * Returns a ref and style object to apply to interactive elements
 */
export function useTouchTarget(options: TouchTargetOptions = {}) {
  const { minWidth = 44, minHeight = 44, className = "" } = options;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const style = window.getComputedStyle(element);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);

    if (width < minWidth || height < minHeight) {
      logger.warn("Touch target too small", {
        width: Math.round(width),
        height: Math.round(height),
        minWidth,
        minHeight,
      });
    }
  }, [minWidth, minHeight]);

  const style = {
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties;

  return { ref, style, className };
}

/**
 * Hook to detect if the user is on a touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is legacy IE/Edge API
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  return isTouch;
}

/**
 * Hook to add active/touch feedback styles to interactive elements
 */
export function useTouchFeedback() {
  const [isActive, setIsActive] = useState(false);

  const handleTouchStart = useCallback(() => setIsActive(true), []);
  const handleTouchEnd = useCallback(() => setIsActive(false), []);
  const handleMouseDown = useCallback(() => setIsActive(true), []);
  const handleMouseUp = useCallback(() => setIsActive(false), []);
  const handleMouseLeave = useCallback(() => setIsActive(false), []);

  return {
    isActive,
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

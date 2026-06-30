"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setCopied(false), timeout);
      return true;
    } catch (err) {
      logger.error("Clipboard copy failed", { error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, [timeout]);

  return { copied, copy };
}

"use client";

import { useState, useCallback } from "react";
import { logger } from "@/lib/logger";

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch (err) {
      logger.error("Clipboard copy failed", { error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, [timeout]);

  return { copied, copy };
}

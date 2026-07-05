"use client";

import { useToast } from "@/components/ui/Toast";

/**
 * Toast helper functions for consistent error/success/warning/info toasts
 * Uses the global Toast context
 */

export const useToastHelpers = () => {
  const { showToast } = useToast();

  const toastSuccess = (message: string) => showToast(message, "success");
  const toastError = (message: string) => showToast(message, "error");
  const toastWarning = (message: string) => showToast(message, "warning");
  const toastInfo = (message: string) => showToast(message, "info");

  return {
    showToast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
  };
};

/**
 * Server-side toast error logger - logs to server console
 * Use this in server components and API routes
 */
export const logToastError = (message: string, context?: Record<string, unknown>) => {
  // In server components, use the logger directly
  console.error(`[TOAST ERROR] ${message}`, context || "");
};

/**
 * Client-side toast error - shows toast and logs to console
 * Use this in client components when you need both
 */
export const showToastError = (message: string) => {
  console.error(`[TOAST ERROR] ${message}`);
  // The toast will be shown via useToastHelpers().toastError()
};
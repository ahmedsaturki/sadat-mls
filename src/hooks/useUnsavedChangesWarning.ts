"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Tracks form dirty state and warns before navigating away with unsaved changes.
 * @param isDirty - Whether the form has unsaved changes
 * @param message - Warning message (shown in browser dialog)
 */
export function useUnsavedChangesWarning(isDirty: boolean, message?: string) {
  const defaultMsg = typeof window !== "undefined"
    ? (window.navigator.language.startsWith("ar") ? "لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟" : "You have unsaved changes. Are you sure you want to leave?")
    : "You have unsaved changes.";

  useEffect(() => {
    if (!isDirty) return;

    const warningMessage = message || defaultMsg;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message, defaultMsg]);
}

/**
 * Tracks whether a form has been modified from its initial state.
 * @param initialValues - The initial form values (reference-stable object)
 * @returns [isDirty, setIsDirty, resetDirty]
 */
export function useFormDirty<T extends Record<string, unknown>>(initialValues: T) {
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const checkDirty = useCallback((currentValues: T) => {
    const changed = Object.keys(initialValuesRef.current).some(
      (key) => JSON.stringify(currentValues[key]) !== JSON.stringify(initialValuesRef.current[key])
    );
    setIsDirty(changed);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  useUnsavedChangesWarning(isDirty);

  return [isDirty, checkDirty, resetDirty] as const;
}

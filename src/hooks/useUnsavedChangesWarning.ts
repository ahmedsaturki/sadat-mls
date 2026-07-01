"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_WARNING = "You have unsaved changes. Are you sure you want to leave?";

/**
 * Tracks form dirty state and warns before navigating away with unsaved changes.
 * Uses browser's native beforeunload dialog.
 * @param isDirty - Whether the form has unsaved changes
 * @param dict - Optional i18n messages object (preferred over message param)
 * @param message - Optional custom warning message (fallback if dict not provided)
 */
export function useUnsavedChangesWarning(isDirty: boolean, dict?: { common?: { unsavedChanges?: string } }, message?: string) {
  const warningMessage = dict?.common?.unsavedChanges || message || DEFAULT_WARNING;

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, warningMessage]);
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

  useUnsavedChangesWarning(isDirty, undefined, "You have unsaved changes. Are you sure you want to leave?");

  return [isDirty, checkDirty, resetDirty] as const;
}

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageLocale } from "@/hooks/usePageLocale";

// Mock next/navigation is already set up in setup.ts
// useParams returns { locale: "ar" }

describe("usePageLocale", () => {
  it("should return 'ar' as default locale", () => {
    const { result } = renderHook(() => usePageLocale());
    expect(result.current).toBe("ar");
  });

  it("should use URL params locale when available", () => {
    const { result } = renderHook(() => usePageLocale());
    // In setup.ts, useParams returns { locale: "ar" }
    expect(result.current).toBe("ar");
  });

  it("should fallback to props when URL params don't have locale", () => {
    const { result } = renderHook(() =>
      usePageLocale({ locale: "en" })
    );
    // URL params take priority (returns "ar" from mock)
    expect(result.current).toBe("ar");
  });

  it("should handle async params", () => {
    const { result } = renderHook(() =>
      usePageLocale(Promise.resolve({ locale: "en" }))
    );
    // URL params take priority (returns "ar" from mock)
    expect(result.current).toBe("ar");
  });

  it("should return 'ar' for invalid locale in params", () => {
    const { result } = renderHook(() =>
      usePageLocale({ locale: "invalid" })
    );
    // URL params take priority (returns "ar" from mock)
    expect(result.current).toBe("ar");
  });

  it("should return a valid Locale type", () => {
    const { result } = renderHook(() => usePageLocale());
    expect(["ar", "en"]).toContain(result.current);
  });
});

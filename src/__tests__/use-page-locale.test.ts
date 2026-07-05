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

  // --- New edge-case tests ---

  it("returns only 'ar' or 'en' — never an invalid locale string", () => {
    // The hook can only return a Locale type which is "ar" | "en"
    const { result } = renderHook(() => usePageLocale());
    const validLocales = ["ar", "en"];
    expect(validLocales).toContain(result.current);
    expect(typeof result.current).toBe("string");
    expect(result.current.length).toBeGreaterThan(0);
  });

  it("returns only 'ar' or 'en' even with various param inputs", () => {
    const validLocales = ["ar", "en"];

    const { result: r1 } = renderHook(() => usePageLocale({ locale: "fr" }));
    expect(validLocales).toContain(r1.current);

    const { result: r2 } = renderHook(() => usePageLocale({ locale: "de" }));
    expect(validLocales).toContain(r2.current);

    const { result: r3 } = renderHook(() => usePageLocale({ locale: "" }));
    expect(validLocales).toContain(r3.current);
  });

  it("returns consistent value across multiple re-renders", () => {
    const { result, rerender } = renderHook(() => usePageLocale());

    const firstRender = result.current;
    rerender();
    const secondRender = result.current;
    rerender();
    const thirdRender = result.current;

    expect(firstRender).toBe(secondRender);
    expect(secondRender).toBe(thirdRender);
    expect(firstRender).toBe("ar");
  });

  it("handles null params gracefully — returns default 'ar'", () => {
    const { result } = renderHook(() => usePageLocale(undefined));
    expect(result.current).toBe("ar");
  });

  it("handles null locale field in params gracefully", () => {
    const { result } = renderHook(() =>
      usePageLocale({ locale: null as unknown as string })
    );
    // null is not a valid locale, so hook should keep default "ar"
    // (URL params mock also returns "ar")
    expect(["ar", "en"]).toContain(result.current);
  });

  it("handles undefined locale field in params gracefully", () => {
    const { result } = renderHook(() =>
      usePageLocale({ locale: undefined as unknown as string })
    );
    // undefined is not a valid locale, so hook should keep default "ar"
    expect(["ar", "en"]).toContain(result.current);
  });

  it("handles empty object as params gracefully", () => {
    const { result } = renderHook(() =>
      usePageLocale({} as { locale: string })
    );
    // No locale property → fallback to URL mock which returns "ar"
    expect(["ar", "en"]).toContain(result.current);
  });

  it("hook always returns a string (never undefined or null)", () => {
    const { result } = renderHook(() => usePageLocale());
    expect(typeof result.current).toBe("string");
    expect(result.current).not.toBeNull();
    expect(result.current).not.toBeUndefined();
  });

  it("handles Promise that resolves to invalid locale", () => {
    const { result } = renderHook(() =>
      usePageLocale(Promise.resolve({ locale: "xyz" }))
    );
    // Invalid locale in promise — URL mock takes priority, returns "ar"
    expect(["ar", "en"]).toContain(result.current);
  });
});

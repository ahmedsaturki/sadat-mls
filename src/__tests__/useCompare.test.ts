import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompare, type PropertyForComparison } from "@/hooks/useCompare";

const KEY = "compare_properties";
const BASE: PropertyForComparison = {
  id: "1",
  title: "Apartment",
  description: null,
  price: 1000000,
  area: 150,
  bedrooms: 3,
  bathrooms: 2,
  zone: "Zone 1",
  type: "Apartment",
  officeName: "Office",
  status: "available",
  primaryImage: null,
};

function makeInput(overrides: Partial<PropertyForComparison> = {}) {
  return { id: "1", title: "Apartment", ...overrides };
}

describe("useCompare", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useCompare());
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.max).toBe(4);
  });

  it("hydrates from sessionStorage on mount", () => {
    const stored = {
      ids: ["1"],
      props: [BASE],
    };
    window.sessionStorage.setItem(KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useCompare());

    expect(result.current.selectedIds).toEqual(["1"]);
    expect(result.current.properties[0].id).toBe("1");
  });

  it("ignores invalid JSON in sessionStorage", () => {
    window.sessionStorage.setItem(KEY, "{ not valid");
    const { result } = renderHook(() => useCompare());
    expect(result.current.count).toBe(0);
  });

  it("addProperty returns true and persists", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      const ok = result.current.addProperty(makeInput({ id: "1" }));
      expect(ok).toBe(true);
    });

    expect(result.current.count).toBe(1);
    const stored = JSON.parse(window.sessionStorage.getItem(KEY) || "{}");
    expect(stored.ids).toEqual(["1"]);
  });

  it("addProperty returns false when max compare size is reached", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty(makeInput({ id: "1" }));
      result.current.addProperty(makeInput({ id: "2", title: "B" }));
      result.current.addProperty(makeInput({ id: "3", title: "C" }));
      result.current.addProperty(makeInput({ id: "4", title: "D" }));
    });

    expect(result.current.count).toBe(4);

    let ok = true;
    act(() => {
      ok = result.current.addProperty(makeInput({ id: "5", title: "E" }));
    });
    expect(ok).toBe(false);
    expect(result.current.count).toBe(4);
  });

  it("addProperty returns false for already-included id (dedupe)", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      expect(result.current.addProperty(makeInput({ id: "1" }))).toBe(true);
    });

    let ok = true;
    act(() => {
      ok = result.current.addProperty(makeInput({ id: "1", title: "Still A" }));
    });
    expect(ok).toBe(false);
    expect(result.current.count).toBe(1);
  });

  it("removeProperty drops a known id", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty(makeInput({ id: "1" }));
      result.current.addProperty(makeInput({ id: "2", title: "B" }));
    });

    act(() => {
      result.current.removeProperty("1");
    });

    expect(result.current.selectedIds).toEqual(["2"]);
    expect(result.current.properties[0].id).toBe("2");
  });

  it("removeProperty is a no-op for an unknown id", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty(makeInput({ id: "1" }));
    });

    act(() => {
      result.current.removeProperty("999");
    });

    expect(result.current.count).toBe(1);
  });

  it("clearAll empties state and storage", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty(makeInput({ id: "1" }));
      result.current.addProperty(makeInput({ id: "2", title: "B" }));
    });
    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.count).toBe(0);
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("isSelected returns true for ids in the comparison", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty(makeInput({ id: "abcdef" }));
    });

    expect(result.current.isSelected("abcdef")).toBe(true);
    expect(result.current.isSelected("nope")).toBe(false);
  });

  it("normalizes partial input property into full shape", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({ id: "x", title: "Just title" });
    });

    const p = result.current.properties[0];
    expect(p.id).toBe("x");
    expect(p.title).toBe("Just title");
    expect(p.bedrooms).toBe(0);
    expect(p.bathrooms).toBe(0);
    expect(p.price).toBeNull();
    expect(p.zone).toBeNull();
  });
});

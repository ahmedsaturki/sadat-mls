import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedSearches, type SavedSearch } from "@/hooks/useSavedSearches";
import type { FilterState } from "@/components/properties/SearchFilters";

const STORAGE_KEY = "saved_searches";

const sampleFilters: FilterState = {
  search: "apartment",
  zoneId: "1",
  typeId: "2",
  minPrice: "500000",
  maxPrice: "2000000",
  minArea: "100",
  maxArea: "300",
  bedrooms: "3",
  bathrooms: "2",
  hasBalcony: true,
  hasParking: false,
  hasElevator: true,
};

describe("useSavedSearches", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with empty state when no storage entry exists", () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("hydrates from localStorage on mount", () => {
    const stored: SavedSearch[] = [
      { id: "1", name: "A", filters: sampleFilters, createdAt: "2026-07-01T00:00:00.000Z" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches.length).toBe(1);
    expect(result.current.savedSearches[0].name).toBe("A");
  });

  it("ignores malformed localStorage payloads", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
  });

  it("saveSearch appends to state and persists", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Two-bed in zone 1", sampleFilters);
    });

    expect(result.current.savedSearches.length).toBe(1);
    expect(result.current.savedSearches[0].name).toBe("Two-bed in zone 1");
    expect(result.current.count).toBe(1);

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored[0].name).toBe("Two-bed in zone 1");
    expect(stored[0].filters).toEqual(sampleFilters);
  });

  it("removeSavedSearch filters by id and persists", () => {
    const initial: SavedSearch[] = [
      { id: "a", name: "A", filters: sampleFilters, createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "b", name: "B", filters: sampleFilters, createdAt: "2026-07-02T00:00:00.000Z" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));

    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.removeSavedSearch("a");
    });

    expect(result.current.savedSearches.length).toBe(1);
    expect(result.current.savedSearches[0].id).toBe("b");

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored.length).toBe(1);
  });

  it("updateLastNotified stamps the matching entry", () => {
    const initial: SavedSearch[] = [
      { id: "a", name: "A", filters: sampleFilters, createdAt: "2026-07-01T00:00:00.000Z" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));

    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.updateLastNotified("a");
    });

    expect(result.current.savedSearches[0].lastNotified).toBeDefined();
    const iso = result.current.savedSearches[0].lastNotified;
    expect(iso && !Number.isNaN(new Date(iso).getTime())).toBe(true);
  });

  it("clearAll empties state and removes the storage key", () => {
    const initial: SavedSearch[] = [
      { id: "a", name: "A", filters: sampleFilters, createdAt: "2026-07-01T00:00:00.000Z" },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));

    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches.length).toBe(1);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.savedSearches).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("multiple saves produce stable, unique ids", () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch("first", sampleFilters);
    });
    act(() => {
      result.current.saveSearch("second", sampleFilters);
    });
    const ids = result.current.savedSearches.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.count).toBe(2);
  });
});

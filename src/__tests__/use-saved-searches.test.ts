import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedSearches } from "@/hooks/useSavedSearches";

// Mock FilterState type (from SearchFilters component)
interface FilterState {
  query?: string;
  minPrice?: string;
  maxPrice?: string;
  propertyType?: string;
  zone?: string;
}

describe("useSavedSearches", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize with empty array", () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("should load saved searches from localStorage", () => {
    const storedSearches = [
      {
        id: "1",
        name: "My Search",
        filters: { query: "apartment" } as FilterState,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    localStorage.setItem("saved_searches", JSON.stringify(storedSearches));

    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].name).toBe("My Search");
  });

  it("should handle corrupted localStorage data gracefully", () => {
    localStorage.setItem("saved_searches", "not-valid-json");

    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
  });

  it("should save a new search", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("My Search", { query: "apartment" } as FilterState);
    });

    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].name).toBe("My Search");
    expect(result.current.savedSearches[0].filters).toEqual({ query: "apartment" });
    expect(result.current.count).toBe(1);
  });

  it("should persist saved searches to localStorage", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("My Search", { query: "apartment" } as FilterState);
    });

    const stored = JSON.parse(localStorage.getItem("saved_searches") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("My Search");
  });

  it("should remove a saved search by id", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Search 1", { query: "a" } as FilterState);
    });

    act(() => {
      result.current.saveSearch("Search 2", { query: "b" } as FilterState);
    });

    expect(result.current.count).toBe(2);

    const idToRemove = result.current.savedSearches[0].id;

    act(() => {
      result.current.removeSavedSearch(idToRemove);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.savedSearches[0].name).toBe("Search 2");
  });

  it("should update lastNotified timestamp", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("My Search", { query: "apartment" } as FilterState);
    });

    const id = result.current.savedSearches[0].id;
    expect(result.current.savedSearches[0].lastNotified).toBeUndefined();

    act(() => {
      result.current.updateLastNotified(id);
    });

    expect(result.current.savedSearches[0].lastNotified).toBeDefined();
  });

  it("should clear all saved searches", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Search 1", { query: "a" } as FilterState);
    });

    act(() => {
      result.current.saveSearch("Search 2", { query: "b" } as FilterState);
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.savedSearches).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(localStorage.getItem("saved_searches")).toBeNull();
  });

  it("should not remove a non-existent search", () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Search 1", { query: "a" } as FilterState);
    });

    act(() => {
      result.current.removeSavedSearch("non-existent-id");
    });

    expect(result.current.count).toBe(1);
  });
});

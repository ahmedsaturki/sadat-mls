import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import type { FilterState } from "@/components/properties/SearchFilters";

const STORAGE_KEY = "saved_searches";

function makeFilters(overrides?: Partial<FilterState>): FilterState {
  return {
    search: "",
    zoneId: "",
    typeId: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    bedrooms: "",
    bathrooms: "",
    hasBalcony: false,
    hasParking: false,
    hasElevator: false,
    developerId: "",
    projectId: "",
    officeId: "",
    ...overrides,
  };
}

describe("useSavedSearches", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with an empty array", () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
  });

  it("count reflects array length", () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.count).toBe(0);
  });

  it("saveSearch adds a search with id, name, filters, createdAt", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("My Search", makeFilters());
    });

    expect(result.current.savedSearches).toHaveLength(1);
    const search = result.current.savedSearches[0];
    expect(search.id).toBeDefined();
    expect(search.name).toBe("My Search");
    expect(search.filters).toEqual(makeFilters());
    expect(search.createdAt).toBeDefined();
  });

  it("saveSearch persists to localStorage", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Persisted", makeFilters());
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Persisted");
  });

  it("loadFromStorage on mount reads existing localStorage data", async () => {
    const existing = [
      {
        id: "pre-existing",
        name: "Pre-loaded",
        filters: makeFilters({ search: "villa" }),
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    const { result } = renderHook(() => useSavedSearches());

    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].name).toBe("Pre-loaded");
  });

  it("removeSavedSearch removes by id", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Search A", makeFilters());
    });
    act(() => {
      result.current.saveSearch("Search B", makeFilters());
    });

    expect(result.current.savedSearches).toHaveLength(2);
    const idToRemove = result.current.savedSearches[0].id;

    act(() => {
      result.current.removeSavedSearch(idToRemove);
    });

    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].name).toBe("Search B");
  });

  it("removeSavedSearch persists to localStorage", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("To Remove", makeFilters());
    });

    const id = result.current.savedSearches[0].id;
    act(() => {
      result.current.removeSavedSearch(id);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(0);
  });

  it("updateLastNotified sets lastNotified timestamp", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Notify Me", makeFilters());
    });

    const id = result.current.savedSearches[0].id;
    expect(result.current.savedSearches[0].lastNotified).toBeUndefined();

    act(() => {
      result.current.updateLastNotified(id);
    });

    expect(result.current.savedSearches[0].lastNotified).toBeDefined();
    expect(new Date(result.current.savedSearches[0].lastNotified!).getTime()).not.toBeNaN();
  });

  it("clearAll empties array and removes localStorage", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("A", makeFilters());
    });
    act(() => {
      result.current.saveSearch("B", makeFilters());
    });

    expect(result.current.savedSearches).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.savedSearches).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("count reflects correct length after operations", async () => {
    const { result } = renderHook(() => useSavedSearches());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.saveSearch("A", makeFilters());
    });
    expect(result.current.count).toBe(1);

    act(() => {
      result.current.saveSearch("B", makeFilters());
    });
    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearAll();
    });
    expect(result.current.count).toBe(0);
  });

  it("multiple saves accumulate", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("First", makeFilters());
    });
    act(() => {
      result.current.saveSearch("Second", makeFilters());
    });
    act(() => {
      result.current.saveSearch("Third", makeFilters());
    });

    expect(result.current.savedSearches).toHaveLength(3);
    expect(result.current.savedSearches.map((s) => s.name)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("saveSearch with empty (default) filters works", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Empty", makeFilters());
    });

    const filters = result.current.savedSearches[0].filters;
    expect(filters.search).toBe("");
    expect(filters.hasBalcony).toBe(false);
  });

  it("ignores malformed localStorage payloads", async () => {
    localStorage.setItem(STORAGE_KEY, "{not-valid-json");

    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toEqual([]);
  });

  it("removeSavedSearch with non-existent id does nothing", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Only", makeFilters());
    });

    act(() => {
      result.current.removeSavedSearch("non-existent-id");
    });

    expect(result.current.savedSearches).toHaveLength(1);
  });

  it("saveSearch generates createdAt as ISO string", async () => {
    const { result } = renderHook(() => useSavedSearches());

    act(() => {
      result.current.saveSearch("Timestamp", makeFilters());
    });

    const iso = result.current.savedSearches[0].createdAt;
    expect(iso).toBeDefined();
    expect(new Date(iso).getTime()).not.toBeNaN();
    // Should be a full ISO string
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

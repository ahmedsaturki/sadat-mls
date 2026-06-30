import { useState, useEffect, useCallback } from "react";
import type { FilterState } from "@/components/properties/SearchFilters";

export type SavedSearch = {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
  lastNotified?: string;
};

const STORAGE_KEY = "saved_searches";

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedSearches(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveToStorage = useCallback((searches: SavedSearch[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    }
  }, []);

  const saveSearch = useCallback((name: string, filters: FilterState) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    setSavedSearches(prev => {
      const updated = [...prev, newSearch];
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeSavedSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateLastNotified = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.map(s =>
        s.id === id ? { ...s, lastNotified: new Date().toISOString() } : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    setSavedSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    savedSearches,
    saveSearch,
    removeSavedSearch,
    updateLastNotified,
    clearAll,
    count: savedSearches.length,
  };
}
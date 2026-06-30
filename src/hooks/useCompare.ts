import { useState, useEffect, useCallback } from "react";

export type PropertyForComparison = {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  zone?: string;
  type?: string;
  officeName?: string;
  status?: string;
  imageUrl?: string;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
};

const MAX_COMPARE = 4;

export function useCompare() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyForComparison[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("compare_properties");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedIds(parsed.ids || []);
        setProperties(parsed.props || []);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveToStorage = useCallback((ids: string[], props: PropertyForComparison[]) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("compare_properties", JSON.stringify({ ids, props }));
    }
  }, []);

  const addProperty = useCallback((property: PropertyForComparison): boolean => {
    let added = false;
    setSelectedIds(prev => {
      if (prev.length >= MAX_COMPARE || prev.includes(property.id)) {
        added = false;
        return prev;
      }
      const newIds = [...prev, property.id];
      setProperties(prevProps => {
        const newProps = [...prevProps, property];
        saveToStorage(newIds, newProps);
        return newProps;
      });
      added = true;
      return newIds;
    });
    return added;
  }, [saveToStorage]);

  const removeProperty = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newIds = prev.filter(pid => pid !== id);
      setProperties(prevProps => {
        const newProps = prevProps.filter(p => p.id !== id);
        saveToStorage(newIds, newProps);
        return newProps;
      });
      return newIds;
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    setSelectedIds([]);
    setProperties([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("compare_properties");
    }
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  return {
    selectedIds,
    properties,
    addProperty,
    removeProperty,
    clearAll,
    isSelected,
    count: selectedIds.length,
    max: MAX_COMPARE,
  };
}
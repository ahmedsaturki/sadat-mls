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

interface CompareState {
  ids: string[];
  props: PropertyForComparison[];
}

export function useCompare() {
  const [state, setState] = useState<CompareState>({ ids: [], props: [] });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("compare_properties");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({ ids: parsed.ids || [], props: parsed.props || [] });
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
    let result = false;
    setState(prev => {
      if (prev.ids.length >= MAX_COMPARE || prev.ids.includes(property.id)) {
        result = false;
        return prev;
      }
      const newIds = [...prev.ids, property.id];
      const newProps = [...prev.props, property];
      saveToStorage(newIds, newProps);
      result = true;
      return { ids: newIds, props: newProps };
    });
    return result;
  }, [saveToStorage]);

  const removeProperty = useCallback((id: string) => {
    setState(prev => {
      if (!prev.ids.includes(id)) return prev;
      const newIds = prev.ids.filter(pid => pid !== id);
      const newProps = prev.props.filter(p => p.id !== id);
      saveToStorage(newIds, newProps);
      return { ids: newIds, props: newProps };
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    setState(prev => {
      if (prev.ids.length === 0) return prev;
      return { ids: [], props: [] };
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("compare_properties");
    }
  }, []);

  const isSelected = useCallback((id: string) => state.ids.includes(id), [state.ids]);

  return {
    selectedIds: state.ids,
    properties: state.props,
    addProperty,
    removeProperty,
    clearAll,
    isSelected,
    count: state.ids.length,
    max: MAX_COMPARE,
  };
}

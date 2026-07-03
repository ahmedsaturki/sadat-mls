import { useState, useEffect, useCallback, useRef } from "react";

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
  const pendingRef = useRef<CompareState>({ ids: [], props: [] });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("compare_properties");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restored = { ids: parsed.ids || [], props: parsed.props || [] };
        setState(restored);
        pendingRef.current = restored;
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
    const pending = pendingRef.current;
    if (pending.ids.length >= MAX_COMPARE || pending.ids.includes(property.id)) {
      return false;
    }
    const newIds = [...pending.ids, property.id];
    const newProps = [...pending.props, property];
    pendingRef.current = { ids: newIds, props: newProps };
    setState({ ids: newIds, props: newProps });
    saveToStorage(newIds, newProps);
    return true;
  }, [saveToStorage]);

  const removeProperty = useCallback((id: string) => {
    setState(prev => {
      if (!prev.ids.includes(id)) return prev;
      const newIds = prev.ids.filter(pid => pid !== id);
      const newProps = prev.props.filter(p => p.id !== id);
      pendingRef.current = { ids: newIds, props: newProps };
      saveToStorage(newIds, newProps);
      return { ids: newIds, props: newProps };
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    pendingRef.current = { ids: [], props: [] };
    setState({ ids: [], props: [] });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("compare_properties");
    }
  }, []);

  const isSelected = useCallback((id: string) => pendingRef.current.ids.includes(id), []);

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

import { useState, useEffect, useCallback, useRef } from "react";

export type PropertyForComparison = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  zone: string | null;
  type: string | null;
  officeName: string | null;
  status: string | null;
  primaryImage: string | null;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
};

type InputProperty = Partial<PropertyForComparison> & Pick<PropertyForComparison, "id" | "title">;

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

  const normalize = (p: InputProperty): PropertyForComparison => ({
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    price: p.price ?? null,
    area: p.area ?? null,
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    zone: p.zone ?? null,
    type: p.type ?? null,
    officeName: p.officeName ?? null,
    status: p.status ?? null,
    primaryImage: p.primaryImage ?? null,
    hasBalcony: p.hasBalcony,
    hasParking: p.hasParking,
    hasElevator: p.hasElevator,
  });

  const addProperty = useCallback((property: InputProperty): boolean => {
    const pending = pendingRef.current;
    if (pending.ids.length >= MAX_COMPARE || pending.ids.includes(property.id)) {
      return false;
    }
    const normalized = normalize(property);
    const newIds = [...pending.ids, property.id];
    const newProps = [...pending.props, normalized];
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

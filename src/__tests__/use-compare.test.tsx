import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompare } from "@/hooks/useCompare";

describe("useCompare hook", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should initialize with empty arrays", () => {
    const { result } = renderHook(() => useCompare());
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.max).toBe(4);
  });

  it("should add a property to comparison", () => {
    const { result } = renderHook(() => useCompare());
    const property = {
      id: "1",
      title: "Test Property",
      price: 1000000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
    };

    act(() => {
      result.current.addProperty(property);
    });

    expect(result.current.selectedIds).toEqual(["1"]);
    expect(result.current.properties).toHaveLength(1);
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected("1")).toBe(true);
  });

  it("should not add duplicate properties", () => {
    const { result } = renderHook(() => useCompare());
    const property = {
      id: "1",
      title: "Test Property",
      price: 1000000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
    };

    act(() => {
      const added1 = result.current.addProperty(property);
      expect(added1).toBe(true);
      const added2 = result.current.addProperty(property);
      expect(added2).toBe(false);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.selectedIds).toEqual(["1"]);
  });

  it("should remove a property from comparison", () => {
    const { result } = renderHook(() => useCompare());
    const property = {
      id: "1",
      title: "Test Property",
      price: 1000000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
    };

    act(() => {
      result.current.addProperty(property);
    });

    act(() => {
      result.current.removeProperty("1");
    });

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toHaveLength(0);
    expect(result.current.isSelected("1")).toBe(false);
  });

  it("should clear all properties", () => {
    const { result } = renderHook(() => useCompare());
    const property1 = { id: "1", title: "P1", price: 100, area: 100, bedrooms: 2, bathrooms: 1 };
    const property2 = { id: "2", title: "P2", price: 200, area: 150, bedrooms: 3, bathrooms: 2 };

    act(() => {
      result.current.addProperty(property1);
      result.current.addProperty(property2);
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toHaveLength(0);
  });

  it("should not add more than 4 properties", () => {
    const { result } = renderHook(() => useCompare());

    // Add 4 properties
    act(() => {
      for (let i = 1; i <= 4; i++) {
        result.current.addProperty({
          id: String(i),
          title: `Property ${i}`,
          price: 100000 * i,
          area: 100 * i,
          bedrooms: 2,
          bathrooms: 1,
        });
      }
    });

    expect(result.current.count).toBe(4);

    // 5th should fail
    act(() => {
      const added = result.current.addProperty({
        id: "5",
        title: "Property 5",
        price: 500000,
        area: 500,
        bedrooms: 3,
        bathrooms: 2,
      });
      expect(added).toBe(false);
    });

    // Count should still be 4
    expect(result.current.count).toBe(4);
  });
});
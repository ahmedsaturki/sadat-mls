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

  // --- New edge-case tests ---

  it("isSelected returns false for non-existent id", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({
        id: "1",
        title: "Property 1",
        price: 100000,
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
      });
    });

    expect(result.current.isSelected("1")).toBe(true);
    expect(result.current.isSelected("999")).toBe(false);
    expect(result.current.isSelected("nonexistent")).toBe(false);
    expect(result.current.isSelected("")).toBe(false);
  });

  it("removeProperty for non-existent id is a no-op", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({
        id: "1",
        title: "Property 1",
        price: 100000,
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
      });
    });

    const stateBefore = {
      ids: [...result.current.selectedIds],
      count: result.current.count,
    };

    act(() => {
      result.current.removeProperty("nonexistent");
    });

    // State should be unchanged
    expect(result.current.selectedIds).toEqual(stateBefore.ids);
    expect(result.current.count).toBe(stateBefore.count);
    expect(result.current.isSelected("1")).toBe(true);
  });

  it("removeProperty for empty string id is a no-op when not present", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({
        id: "1",
        title: "Property 1",
        price: 100000,
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
      });
    });

    act(() => {
      result.current.removeProperty("");
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isSelected("1")).toBe(true);
  });

  it("multiple removeProperty calls remove items sequentially", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({ id: "1", title: "P1", price: 100, area: 100, bedrooms: 2, bathrooms: 1 });
      result.current.addProperty({ id: "2", title: "P2", price: 200, area: 150, bedrooms: 3, bathrooms: 2 });
      result.current.addProperty({ id: "3", title: "P3", price: 300, area: 200, bedrooms: 4, bathrooms: 3 });
    });

    expect(result.current.count).toBe(3);

    act(() => {
      result.current.removeProperty("2");
    });
    expect(result.current.count).toBe(2);
    expect(result.current.selectedIds).toEqual(["1", "3"]);

    act(() => {
      result.current.removeProperty("1");
    });
    expect(result.current.count).toBe(1);
    expect(result.current.selectedIds).toEqual(["3"]);

    act(() => {
      result.current.removeProperty("3");
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toHaveLength(0);
  });

  it("addProperty normalizes partial data — missing price/area default to null", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({
        id: "1",
        title: "Minimal Property",
        // price omitted → should become null
        // area omitted → should become null
        // bedrooms omitted → should become 0
        // bathrooms omitted → should become 0
        // optional fields omitted → should be undefined
      });
    });

    expect(result.current.count).toBe(1);
    const prop = result.current.properties[0];
    expect(prop.id).toBe("1");
    expect(prop.title).toBe("Minimal Property");
    expect(prop.price).toBeNull();
    expect(prop.area).toBeNull();
    expect(prop.bedrooms).toBe(0);
    expect(prop.bathrooms).toBe(0);
    expect(prop.description).toBeNull();
    expect(prop.zone).toBeNull();
    expect(prop.type).toBeNull();
    expect(prop.officeName).toBeNull();
    expect(prop.status).toBeNull();
    expect(prop.primaryImage).toBeNull();
  });

  it("addProperty normalizes partial data — explicit values are preserved", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({
        id: "2",
        title: "Full Property",
        price: 500000,
        area: 200,
        bedrooms: 3,
        bathrooms: 2,
        description: "Nice place",
        zone: "Zone A",
        type: "Apartment",
        officeName: "Office X",
        status: "active",
        primaryImage: "img.jpg",
        hasBalcony: true,
        hasParking: false,
        hasElevator: true,
      });
    });

    const prop = result.current.properties[0];
    expect(prop.price).toBe(500000);
    expect(prop.area).toBe(200);
    expect(prop.bedrooms).toBe(3);
    expect(prop.bathrooms).toBe(2);
    expect(prop.description).toBe("Nice place");
    expect(prop.zone).toBe("Zone A");
    expect(prop.type).toBe("Apartment");
    expect(prop.officeName).toBe("Office X");
    expect(prop.status).toBe("active");
    expect(prop.primaryImage).toBe("img.jpg");
    expect(prop.hasBalcony).toBe(true);
    expect(prop.hasParking).toBe(false);
    expect(prop.hasElevator).toBe(true);
  });

  it("properties persist in sessionStorage and can be read back", () => {
    const { result } = renderHook(() => useCompare());

    const prop1 = { id: "10", title: "Persisted P1", price: 100000, area: 80, bedrooms: 2, bathrooms: 1 };
    const prop2 = { id: "20", title: "Persisted P2", price: 200000, area: 120, bedrooms: 3, bathrooms: 2 };

    act(() => {
      result.current.addProperty(prop1);
      result.current.addProperty(prop2);
    });

    // Read sessionStorage directly to verify persistence
    const stored = sessionStorage.getItem("compare_properties");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.ids).toEqual(["10", "20"]);
    expect(parsed.props).toHaveLength(2);
    expect(parsed.props[0].id).toBe("10");
    expect(parsed.props[0].title).toBe("Persisted P1");
    expect(parsed.props[1].id).toBe("20");
    expect(parsed.props[1].title).toBe("Persisted P2");
  });

  it("clearAll resets sessionStorage", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({ id: "1", title: "P1", price: 100, area: 100, bedrooms: 2, bathrooms: 1 });
      result.current.addProperty({ id: "2", title: "P2", price: 200, area: 150, bedrooms: 3, bathrooms: 2 });
    });

    // Verify sessionStorage has data
    expect(sessionStorage.getItem("compare_properties")).not.toBeNull();

    act(() => {
      result.current.clearAll();
    });

    // sessionStorage should be cleared
    expect(sessionStorage.getItem("compare_properties")).toBeNull();
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.properties).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it("removeProperty persists updated state to sessionStorage", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.addProperty({ id: "1", title: "P1", price: 100, area: 100, bedrooms: 2, bathrooms: 1 });
      result.current.addProperty({ id: "2", title: "P2", price: 200, area: 150, bedrooms: 3, bathrooms: 2 });
    });

    act(() => {
      result.current.removeProperty("1");
    });

    const stored = JSON.parse(sessionStorage.getItem("compare_properties")!);
    expect(stored.ids).toEqual(["2"]);
    expect(stored.props).toHaveLength(1);
    expect(stored.props[0].id).toBe("2");
  });
});
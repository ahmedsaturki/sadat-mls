import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";

interface TestItem {
  id: string;
  name: string;
}

describe("useOptimisticUpdate", () => {
  const createOptions = () => ({
    onMutate: vi.fn((current: TestItem[], optimistic: TestItem) => [...current, optimistic]),
    onError: vi.fn(),
    onSettled: vi.fn(),
  });

  it("initializes with provided data", () => {
    const initialData: TestItem[] = [{ id: "1", name: "Item 1" }];
    const { result } = renderHook(() => useOptimisticUpdate(initialData, createOptions()));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.isPending).toBe(false);
  });

  it("add - optimistically adds item and replaces on success", async () => {
    const options = createOptions();
    const newItem: TestItem = { id: "2", name: "Item 2" };
    const serverItem: TestItem = { id: "2", name: "Server Item 2" };

    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([{ id: "1", name: "Item 1" }], options)
    );

    await act(async () => {
      await result.current.add(newItem, async () => serverItem);
    });

    expect(result.current.data).toEqual([
      { id: "1", name: "Item 1" },
      { id: "2", name: "Server Item 2" },
    ]);
    expect(result.current.isPending).toBe(false);
    expect(options.onSettled).toHaveBeenCalled();
  });

  it("add - rolls back on error", async () => {
    const options = createOptions();
    const newItem: TestItem = { id: "2", name: "Item 2" };

    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([{ id: "1", name: "Item 1" }], options)
    );

    await act(async () => {
      await result.current.add(newItem, async () => {
        throw new Error("Server error");
      });
    });

    expect(result.current.data).toEqual([{ id: "1", name: "Item 1" }]);
    expect(options.onError).toHaveBeenCalled();
  });

  it("remove - optimistically removes item", async () => {
    const options = createOptions();
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>(
        [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ],
        options
      )
    );

    await act(async () => {
      await result.current.remove("2", async () => {});
    });

    expect(result.current.data).toEqual([{ id: "1", name: "Item 1" }]);
  });

  it("remove - rolls back on error", async () => {
    const options = createOptions();
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>(
        [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ],
        options
      )
    );

    await act(async () => {
      await result.current.remove("2", async () => {
        throw new Error("Server error");
      });
    });

    // remove rolls back to previous data (without calling onError - it logs internally)
    expect(result.current.data).toEqual([
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ]);
    expect(result.current.isPending).toBe(false);
  });

  it("setData - directly updates data", () => {
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([], createOptions())
    );

    act(() => {
      result.current.setData([{ id: "1", name: "Direct" }]);
    });

    expect(result.current.data).toEqual([{ id: "1", name: "Direct" }]);
  });

  it("setData - accepts updater function", () => {
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([{ id: "1", name: "Item 1" }], createOptions())
    );

    act(() => {
      result.current.setData((prev) => [...prev, { id: "2", name: "Item 2" }]);
    });

    expect(result.current.data).toHaveLength(2);
  });
});

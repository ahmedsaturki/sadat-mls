import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";

interface TestItem {
  id: string;
  name: string;
}

describe("useOptimisticUpdate", () => {
  const createOptions = (overrides?: { onMutate?: (current: TestItem[], optimistic: TestItem) => TestItem[] }) => ({
    onMutate: vi.fn((current: TestItem[], optimistic: TestItem) => [...current, optimistic]),
    onError: vi.fn(),
    onSettled: vi.fn(),
    ...overrides,
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

  it("update - calls mutate and replaces with server result", async () => {
    const options = createOptions({
      onMutate: (current, optimistic) =>
        current.map((item) =>
          item.id === optimistic.id ? optimistic : item
        ),
    });
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>(
        [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ],
        options
      )
    );

    const serverResult: TestItem = { id: "1", name: "Server Updated" };

    await act(async () => {
      await result.current.update(
        { id: "1", name: "Optimistic" },
        async () => serverResult
      );
    });

    expect(result.current.data).toEqual([
      { id: "1", name: "Server Updated" },
      { id: "2", name: "Item 2" },
    ]);
  });

  it("add - returns null action replaces with optimistic item", async () => {
    const options = createOptions();
    const newItem: TestItem = { id: "3", name: "New Item" };

    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([], options)
    );

    await act(async () => {
      await result.current.add(newItem, async () => null);
    });

    expect(result.current.data).toEqual([{ id: "3", name: "New Item" }]);
  });

  it("remove - removes non-existent item gracefully", async () => {
    const options = createOptions();
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([{ id: "1", name: "Item 1" }], options)
    );

    await act(async () => {
      await result.current.remove("nonexistent", async () => {});
    });

    expect(result.current.data).toEqual([{ id: "1", name: "Item 1" }]);
  });

  it("multiple concurrent adds", async () => {
    const options = createOptions();
    const { result } = renderHook(() =>
      useOptimisticUpdate<TestItem>([], options)
    );

    await act(async () => {
      await Promise.all([
        result.current.add({ id: "1", name: "A" }, async () => ({ id: "1", name: "A-srv" })),
        result.current.add({ id: "2", name: "B" }, async () => ({ id: "2", name: "B-srv" })),
      ]);
    });

    expect(result.current.data).toHaveLength(2);
  });
});

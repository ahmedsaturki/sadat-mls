import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";

type Item = { id: string; name: string };

const makeItem = (id: string, name: string): Item => ({ id, name });

describe("useOptimisticUpdate", () => {
  it("initializes with the supplied data", () => {
    const initial = [makeItem("1", "Alice")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
      }),
    );

    expect(result.current.data).toEqual(initial);
    expect(result.current.isPending).toBe(false);
  });

  it("add() applies the optimistic update immediately, then confirms", async () => {
    const initial: Item[] = [makeItem("1", "Alice")];
    const onSettled = vi.fn();
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
        onSettled,
      }),
    );

    await act(async () => {
      await result.current.add(makeItem("2", "Bob"), async () => makeItem("2", "Bob"));
    });

    expect(result.current.data).toContainEqual(makeItem("2", "Bob"));
    expect(onSettled).toHaveBeenCalled();
  });

  it("update() resolves the action and patches the matching item", async () => {
    const initial = [makeItem("1", "Alice"), makeItem("2", "Bob")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) =>
          current.map((it) => (it.id === opt.id ? opt : it)),
        onError: () => undefined,
      }),
    );

    await act(async () => {
      await result.current.update(makeItem("2", "Bobby"), async () =>
        makeItem("2", "Bobby"),
      );
    });

    expect(result.current.data.find((it) => it.id === "2")?.name).toBe("Bobby");
  });

  it("rolls back to previous data on action failure", async () => {
    const initial = [makeItem("1", "Alice")];
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError,
      }),
    );

    await act(async () => {
      await result.current.add(makeItem("2", "Bob"), async () => {
        throw new Error("network");
      });
    });

    expect(result.current.data).toEqual(initial);
    expect(onError).toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  it("remove() filters the item out immediately", async () => {
    const initial = [makeItem("1", "Alice"), makeItem("2", "Bob")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
      }),
    );

    await act(async () => {
      await result.current.remove("1", async () => undefined);
    });

    expect(result.current.data.find((it) => it.id === "1")).toBeUndefined();
    expect(result.current.data.find((it) => it.id === "2")).toBeDefined();
  });

  it("remove() rolls back if the action throws", async () => {
    const initial = [makeItem("1", "Alice"), makeItem("2", "Bob")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
      }),
    );

    await act(async () => {
      await result.current.remove("1", async () => {
        throw new Error("delete failed");
      });
    });

    expect(result.current.data).toEqual(initial);
  });

  it("setData can replace state directly", () => {
    const initial = [makeItem("1", "Alice")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
      }),
    );

    act(() => {
      result.current.setData([makeItem("x", "Y")]);
    });
    expect(result.current.data).toEqual([makeItem("x", "Y")]);
  });

  it("setData supports functional updater", () => {
    const initial = [makeItem("1", "A")];
    const { result } = renderHook(() =>
      useOptimisticUpdate<Item>(initial, {
        onMutate: (current, opt) => [...current, opt],
        onError: () => undefined,
      }),
    );

    act(() => {
      result.current.setData((prev) => [...prev, makeItem("2", "B")]);
    });
    expect(result.current.data).toEqual([
      makeItem("1", "A"),
      makeItem("2", "B"),
    ]);
  });
});

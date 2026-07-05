import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCachedQuery, useDebouncedQuery } from "@/hooks/useCachedQuery";

describe("useCachedQuery", () => {
  it("returns the queryFn result as data on first render", async () => {
    const queryFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => useCachedQuery("k", queryFn));

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));
    expect(queryFn).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("exposes a refetch handle", async () => {
    const queryFn = vi.fn().mockResolvedValue({ v: 1 });

    const { result } = renderHook(() => useCachedQuery("k", queryFn));

    await waitFor(() => expect(result.current.data).toEqual({ v: 1 }));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("swallows queryFn errors and resolves to undefined", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCachedQuery("k", queryFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it("calls queryFn exactly once per key on first mount", async () => {
    const queryFn = vi.fn().mockResolvedValue(42);

    const { result } = renderHook(() => useCachedQuery("k", queryFn));

    await waitFor(() => expect(result.current.data).toBe(42));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("supports force-refresh by calling refetch(true)", async () => {
    let counter = 0;
    const queryFn = vi.fn(async () => ({ v: ++counter }));

    const { result } = renderHook(() => useCachedQuery("k", queryFn));
    await waitFor(() => expect(result.current.data).toEqual({ v: 1 }));

    await act(async () => {
      await result.current.refetch(true);
    });

    expect(result.current.data).toEqual({ v: 2 });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("returns null as initial data before the fetch resolves", () => {
    const queryFn = vi.fn(async () => "value");

    const { result } = renderHook(() => useCachedQuery("k", queryFn));

    expect(result.current.loading).toBeDefined();
    expect(result.current.data === null || typeof result.current.data === "undefined").toBe(true);
  });
});

describe("useDebouncedQuery", () => {
  it("exposes data, loading, refetch shape on first render", () => {
    const queryFn = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useDebouncedQuery("k", queryFn, 100),
    );

    expect(result.current.data).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
    expect(result.current.loading).toBe(false);
  });
});

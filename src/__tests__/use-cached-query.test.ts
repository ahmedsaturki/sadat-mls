import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCachedQuery, useDebouncedQuery } from "@/hooks/useCachedQuery";

// Helper to flush promises in fake timer environment
async function flushPromises() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useCachedQuery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with null data and loading false", () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("should fetch data on mount", async () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    // Flush the promise from useEffect -> fetchData
    await flushPromises();

    expect(result.current.data).toBe("test-data");
    expect(result.current.loading).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should use cached data on subsequent renders with same key", async () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result, rerender } = renderHook(
      ({ key }) => useCachedQuery(key, queryFn),
      { initialProps: { key: "key1" } }
    );

    await flushPromises();

    expect(result.current.data).toBe("test-data");

    rerender({ key: "key1" });

    // Should not call queryFn again (cached)
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should refetch when key changes", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("data-1")
      .mockResolvedValueOnce("data-2");
    
    const { rerender } = renderHook(
      ({ key }) => useCachedQuery(key, queryFn),
      { initialProps: { key: "key1" } }
    );

    await flushPromises();

    rerender({ key: "key2" });

    await flushPromises();

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("should refetch when forceRefresh is true", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("data-1")
      .mockResolvedValueOnce("data-2");

    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await flushPromises();

    expect(result.current.data).toBe("data-1");

    await act(async () => {
      await result.current.refetch(true);
    });

    expect(result.current.data).toBe("data-2");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("should return cached data within TTL", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("data-1")
      .mockResolvedValueOnce("data-2");

    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await flushPromises();

    expect(result.current.data).toBe("data-1");

    // Advance time but within TTL (2 minutes)
    act(() => {
      vi.advanceTimersByTime(60 * 1000); // 1 minute
    });

    await act(async () => {
      await result.current.refetch();
    });

    // Should use cache, not refetch
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should refetch after TTL expires", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("data-1")
      .mockResolvedValueOnce("data-2");

    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await flushPromises();

    expect(result.current.data).toBe("data-1");

    // Advance time past TTL (2 minutes)
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000 + 1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("should handle query function errors gracefully", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await flushPromises();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe("useDebouncedQuery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with null data", () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useDebouncedQuery("key1", queryFn));

    expect(result.current.data).toBeNull();
  });

  it("should debounce the query execution", async () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useDebouncedQuery("key1", queryFn, 300));

    act(() => {
      result.current.refetch();
    });

    // Not called yet
    expect(queryFn).not.toHaveBeenCalled();

    // Advance past delay
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Wait for the promise to resolve
    await flushPromises();

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should reset timer on rapid refetch calls", async () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() => useDebouncedQuery("key1", queryFn, 300));

    act(() => {
      result.current.refetch();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.refetch();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Still not called
    expect(queryFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    await flushPromises();

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should clean up timeout on unmount", () => {
    const queryFn = vi.fn().mockResolvedValue("test-data");
    const { unmount } = renderHook(() => useDebouncedQuery("key1", queryFn, 300));

    unmount();

    // No error should occur after advancing time
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it("should resolve with undefined on error (graceful degradation)", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useDebouncedQuery("key1", queryFn, 300));

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.refetch();
      vi.advanceTimersByTime(300);
    });

    await flushPromises();

    expect(returnValue).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });
});

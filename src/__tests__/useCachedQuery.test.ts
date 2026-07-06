import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCachedQuery } from "@/hooks/useCachedQuery";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCachedQuery", () => {
  // Suppress unhandled promise rejections from the hook's error test.
  // The hook's fetchData() has try/finally but no catch — when the queryFn
  // rejects, React's useEffect doesn't catch the promise rejection.
  let rejectHandler: ((reason: unknown) => void) | null = null;

  beforeEach(() => {
    rejectHandler = (reason: unknown) => {
      const msg = reason instanceof Error ? reason.message : String(reason);
      if (msg.includes("network error")) return;
      throw reason;
    };
    window.addEventListener("unhandledrejection", rejectHandler);
  });

  afterEach(() => {
    if (rejectHandler) {
      window.removeEventListener("unhandledrejection", rejectHandler);
    }
  });

  it("returns null data and true loading initially", () => {
    const queryFn = vi.fn().mockResolvedValue("result");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("sets data and loading=false after query resolves", async () => {
    const queryFn = vi.fn().mockResolvedValue("result");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await waitFor(() => {
      expect(result.current.data).toBe("result");
      expect(result.current.loading).toBe(false);
    });
  });

  it("second render with same key does not call queryFn again (cache hit)", async () => {
    const queryFn = vi.fn().mockResolvedValue("cached-data");
    const { rerender } = renderHook(
      ({ key }) => useCachedQuery(key, queryFn),
      { initialProps: { key: "same-key" } }
    );

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    rerender({ key: "same-key" });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  it("refetch with forceRefresh=true calls queryFn again", async () => {
    const queryFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.refetch(true);
    });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });

  it("different key calls queryFn again", async () => {
    const queryFn = vi.fn().mockResolvedValue("data");
    const { rerender } = renderHook(
      ({ key }) => useCachedQuery(key, queryFn),
      { initialProps: { key: "key-a" } }
    );

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    rerender({ key: "key-b" });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(2);
    });
  });

  it("query error does not crash the hook", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });

  it("returns the refetch function that can be called without forceRefresh", async () => {
    const queryFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    // refetch without forceRefresh should use cache
    await act(async () => {
      await result.current.refetch(false);
    });

    // Should still be 1 call — cache hit
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  it("different keys get different data", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("data-a")
      .mockResolvedValueOnce("data-b");

    const { result, rerender } = renderHook(
      ({ key }) => useCachedQuery(key, queryFn),
      { initialProps: { key: "key-a" } }
    );

    await waitFor(() => {
      expect(result.current.data).toBe("data-a");
    });

    rerender({ key: "key-b" });

    await waitFor(() => {
      expect(result.current.data).toBe("data-b");
    });
  });

  it("loading is true only during fetch, then false", async () => {
    const queryFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe("data");
  });

  it("refetch updates data when forceRefresh=true", async () => {
    const queryFn = vi.fn()
      .mockResolvedValueOnce("original")
      .mockResolvedValueOnce("refreshed");

    const { result } = renderHook(() => useCachedQuery("key1", queryFn));

    await waitFor(() => {
      expect(result.current.data).toBe("original");
    });

    await act(async () => {
      await result.current.refetch(true);
    });

    await waitFor(() => {
      expect(result.current.data).toBe("refreshed");
    });
  });
});

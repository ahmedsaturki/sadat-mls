import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

describe("useInfiniteScroll", () => {
  let capturedCallback: IntersectionObserverCallback | null = null;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    capturedCallback = null;
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    // Mock IntersectionObserver — capture the callback
    vi.stubGlobal(
      "IntersectionObserver",
      class MockIntersectionObserver implements IntersectionObserver {
        constructor(cb: IntersectionObserverCallback) {
          capturedCallback = cb;
        }
        observe = observeSpy;
        disconnect = disconnectSpy;
        unobserve = vi.fn();
        root = null;
        rootMargin = "";
        thresholds = [];
        takeRecords = vi.fn().mockReturnValue([]);
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a sentinelRef", () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore: vi.fn(),
      })
    );

    expect(result.current.sentinelRef).toBeDefined();
  });

  it("should create an IntersectionObserver on mount", () => {
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore: vi.fn(),
      })
    );

    // The observer is created but observe is not called until ref is set
    expect(capturedCallback).toBeInstanceOf(Function);
  });

  it("should call onLoadMore when sentinel is intersecting and hasMore is true", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore,
      })
    );

    // Simulate intersection via the captured callback
    const entry = {
      isIntersecting: true,
    } as IntersectionObserverEntry;

    capturedCallback!([entry], {} as IntersectionObserver);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("should NOT call onLoadMore when hasMore is false", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: false,
        loading: false,
        onLoadMore,
      })
    );

    const entry = {
      isIntersecting: true,
    } as IntersectionObserverEntry;

    capturedCallback!([entry], {} as IntersectionObserver);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should NOT call onLoadMore when loading is true", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: true,
        onLoadMore,
      })
    );

    const entry = {
      isIntersecting: true,
    } as IntersectionObserverEntry;

    capturedCallback!([entry], {} as IntersectionObserver);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should NOT call onLoadMore when not intersecting", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore,
      })
    );

    const entry = {
      isIntersecting: false,
    } as IntersectionObserverEntry;

    capturedCallback!([entry], {} as IntersectionObserver);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("should disconnect observer on cleanup", () => {
    let hasMore = true;
    const { result, unmount, rerender } = renderHook(() =>
      useInfiniteScroll({
        hasMore,
        loading: false,
        onLoadMore: vi.fn(),
      })
    );

    // Set the sentinel ref to a DOM element so the effect creates an observer
    result.current.sentinelRef.current = document.createElement("div");

    // Re-render with changed prop to re-run the effect with sentinel available
    hasMore = false;
    rerender();

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});

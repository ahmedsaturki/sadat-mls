import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

let lastObserver: { cb: (entries: Array<{ isIntersecting: boolean }>) => void } | null = null;

function makeMockIntersectionObserver(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
  const self = {
    cb,
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
    root: null,
    rootMargin: "",
    thresholds: [],
  } as unknown as IntersectionObserver & {
    cb: (entries: Array<{ isIntersecting: boolean }>) => void;
  };
  return self;
}

beforeEach(() => {
  lastObserver = null;

  class MockIntersectionObserver {
    cb: (entries: Array<{ isIntersecting: boolean }>) => void;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    root = null;
    rootMargin = "";
    thresholds = [];
    constructor(inputCb: (entries: Array<{ isIntersecting: boolean }>) => void) {
      lastObserver = makeMockIntersectionObserver(inputCb);
      this.cb = inputCb;
    }
  }

  Object.defineProperty(global, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver as unknown as typeof IntersectionObserver,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useInfiniteScroll", () => {
  it("returns a sentinelRef (an object with .current)", () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore,
      }),
    );

    expect(typeof result.current.sentinelRef).toBe("object");
    expect("current" in result.current.sentinelRef).toBe(true);
  });

  it("does not construct an observer before sentinelRef.current is bound", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: false,
        onLoadMore,
      }),
    );

    expect(lastObserver).toBeNull();
  });

  it("does not fire onLoadMore while hasMore=false", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: false,
        loading: false,
        onLoadMore,
      }),
    );
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("does not fire onLoadMore while loading=true", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        loading: true,
        onLoadMore,
      }),
    );
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useInterval,
  useTimeout,
  useMediaQuery,
  useWindowSize,
  useOnlineStatus,
  usePageVisibility,
  useUnloadWarning,
} from "@/hooks/useBrowser";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback repeatedly at the delay", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(cb, 100));

    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    act(() => vi.advanceTimersByTime(100));
    act(() => vi.advanceTimersByTime(100));

    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("does not set a timer when delay === null", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(cb, null));
    act(() => vi.advanceTimersByTime(1000));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("useTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes callback once after the delay", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(cb, 200));
    act(() => vi.advanceTimersByTime(199));
    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not set timer when delay is null", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(cb, null));
    act(() => vi.advanceTimersByTime(2000));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("useMediaQuery", () => {
  it("returns false when window.matchMedia reports no match", () => {
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn().mockImplementation((q: string) => ({
          matches: false,
          media: q,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    }
    const { result } = renderHook(() => useMediaQuery("(min-width: 100px)"));
    expect(result.current).toBe(false);
  });
});

describe("useWindowSize", () => {
  it("returns numbers for width and height", () => {
    const { result } = renderHook(() => useWindowSize());
    expect(typeof result.current.width).toBe("number");
    expect(typeof result.current.height).toBe("number");
  });
});

describe("useOnlineStatus", () => {
  it("returns a boolean for isOnline", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe("boolean");
  });

  it("registers online and offline event listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useOnlineStatus());
    const events = addSpy.mock.calls.map(([type]) => type);
    expect(events).toContain("online");
    expect(events).toContain("offline");
    addSpy.mockRestore();
  });
});

describe("usePageVisibility", () => {
  it("returns a boolean", () => {
    const { result } = renderHook(() => usePageVisibility());
    expect(typeof result.current).toBe("boolean");
  });
});

describe("useUnloadWarning", () => {
  it("attaches a beforeunload listener when condition is true", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnloadWarning(true));
    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    addSpy.mockRestore();
  });
});

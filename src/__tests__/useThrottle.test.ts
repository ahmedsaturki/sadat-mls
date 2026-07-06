import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThrottle, useThrottledValue } from "@/hooks/useThrottle";

describe("useThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a callable function", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 100));
    expect(typeof result.current).toBe("function");
  });

  it("invokes the callback on the first call immediately", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 100));

    act(() => {
      result.current();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("drops the second call within the delay window", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 1000));

    act(() => {
      result.current();
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
      result.current();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("passes args through to the inner callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 1000));

    act(() => {
      result.current("hello", { key: "value" }, 42);
    });

    expect(callback).toHaveBeenCalledWith("hello", { key: "value" }, 42);
  });

  it("invokes the latest callback closure (no stale captures)", () => {
    const callbackA = vi.fn();
    const callbackB = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useThrottle(cb, 1000),
      { initialProps: { cb: callbackA } },
    );

    act(() => {
      result.current();
    });
    expect(callbackA).toHaveBeenCalledTimes(1);

    rerender({ cb: callbackB });

    act(() => {
      vi.advanceTimersByTime(1000);
      result.current();
    });

    expect(callbackA).toHaveBeenCalledTimes(1); // not called again
    expect(callbackB).toHaveBeenCalledTimes(1);
  });
});

describe("useThrottledValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value on first render", () => {
    const { result } = renderHook(() => useThrottledValue("a", 100));
    expect(result.current).toBe("a");
  });

  it("updates immediately when the delay is satisfied", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "first", delay: 100 } },
    );

    rerender({ value: "second", delay: 100 });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("second");
  });

  it("schedules a deferred update when within the delay window", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "a", delay: 200 } },
    );

    rerender({ value: "b", delay: 200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("b");
  });

  it("supports zero-delay (still synchronous after one tick)", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "x", delay: 0 } },
    );

    rerender({ value: "y", delay: 0 });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe("y");
  });

  it("cancels a pending update when a fresh value arrives", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "a", delay: 200 } },
    );

    rerender({ value: "b", delay: 200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "c", delay: 200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("c");

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe("c");
  });
});

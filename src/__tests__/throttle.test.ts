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

  it("calls function immediately on first call", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      result.current("arg1");
    });

    expect(fn).toHaveBeenCalledWith("arg1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throttles subsequent calls within delay", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      result.current("arg1");
    });

    act(() => {
      vi.advanceTimersByTime(50);
      result.current("arg2");
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("allows calls after delay expires", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      result.current("arg1");
    });

    act(() => {
      vi.advanceTimersByTime(100);
      result.current("arg2");
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("arg2");
  });

  it("drops calls during cooldown (no trailing call)", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      result.current("first");
    });

    act(() => {
      vi.advanceTimersByTime(50);
      result.current("second");
      result.current("third");
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Only the first call goes through; calls during cooldown are dropped
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("first");
  });

  it("handles rapid-fire calls", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current(`call-${i}`);
      }
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("call-0");
  });

  it("handles no-argument calls", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => {
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith();
  });

  it("allows multiple calls spread across delays", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 100));

    act(() => { result.current("a"); });
    act(() => { vi.advanceTimersByTime(100); result.current("b"); });
    act(() => { vi.advanceTimersByTime(100); result.current("c"); });

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenLastCalledWith("c");
  });
});

describe("useThrottledValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useThrottledValue("initial", 100));
    expect(result.current).toBe("initial");
  });

  it("updates value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "initial", delay: 100 } }
    );

    rerender({ value: "updated", delay: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("updated");
  });

  it("updates to latest value after enough total time", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "v0", delay: 100 } }
    );

    act(() => {
      rerender({ value: "v1", delay: 100 });
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("v1");
  });

  it("eventually reflects rapid changes after total delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "v0", delay: 100 } }
    );

    act(() => {
      rerender({ value: "v1", delay: 100 });
      vi.advanceTimersByTime(50);
      rerender({ value: "v2", delay: 100 });
      vi.advanceTimersByTime(100);
    });

    // v2 timeout replaces v1 timeout, so after total delay we see v2
    expect(result.current).toBe("v2");
  });

  it("handles string, number, and object value types", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottledValue(value, delay),
      { initialProps: { value: "string", delay: 100 } }
    );

    rerender({ value: 42, delay: 100 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe(42);

    rerender({ value: { key: "val" }, delay: 100 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toEqual({ key: "val" });
  });
});

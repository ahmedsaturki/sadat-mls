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
});

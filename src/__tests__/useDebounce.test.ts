import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue, useDebouncedCallback } from "@/hooks/useDebounce";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the input value immediately on first render", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 200));
    expect(result.current).toBe("hello");
  });

  it("updates after the delay when value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "first", delay: 200 } },
    );

    rerender({ value: "second", delay: 200 });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("second");
  });

  it("resets the timer when value changes again before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 100 } },
    );

    rerender({ value: "b", delay: 100 });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    rerender({ value: "c", delay: 100 });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current).toBe("c");
  });

  it("honors a 0 delay (still async-ish)", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 0 } },
    );

    rerender({ value: "b", delay: 0 });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe("b");
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a stable callback across renders", () => {
    const cb = () => {};
    const { result, rerender } = renderHook(() =>
      useDebouncedCallback(cb, 100),
    );

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("delays invocation by the specified delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    act(() => {
      result.current("hello");
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("hello");
  });

  it("resets the timer on subsequent fires", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    act(() => {
      result.current("a");
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    act(() => {
      result.current("b");
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("b");
  });

  it("uses the latest callback closure (no stale captures)", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncedCallback(cb, 50),
      { initialProps: { cb: cb1 } },
    );

    act(() => {
      result.current("x");
    });

    rerender({ cb: cb2 });
    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledWith("x");
  });
});

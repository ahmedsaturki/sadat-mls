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

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("should not update value before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "hello", delay: 300 } }
    );

    rerender({ value: "world", delay: 300 });
    expect(result.current).toBe("hello");

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("hello");
  });

  it("should update value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "hello", delay: 300 } }
    );

    rerender({ value: "world", delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("world");
  });

  it("should reset timer on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } }
    );

    rerender({ value: "b", delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: "c", delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("a");

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe("c");
  });

  it("should use default delay of 300ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: "hello" } }
    );

    rerender({ value: "world" });
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe("hello");

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe("world");
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a stable function reference", () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb, delay }) => useDebouncedCallback(cb, delay),
      { initialProps: { cb: callback, delay: 300 } }
    );

    const fn1 = result.current;
    rerender({ cb: callback, delay: 300 });
    expect(result.current).toBe(fn1);
  });

  it("should debounce calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => { result.current("arg1"); });
    expect(callback).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(300); });
    expect(callback).toHaveBeenCalledWith("arg1");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should only call once for rapid invocations", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => { result.current("a"); });
    act(() => { result.current("b"); });
    act(() => { result.current("c"); });
    act(() => { vi.advanceTimersByTime(300); });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("c");
  });
});

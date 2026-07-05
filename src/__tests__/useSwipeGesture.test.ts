import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

function mkTouchEvent(x: number, y: number): React.TouchEvent {
  return {
    touches: [{ clientX: x, clientY: y } as React.Touch],
    changedTouches: [{ clientX: x, clientY: y } as React.Touch],
  } as unknown as React.TouchEvent;
}

describe("useSwipeGesture", () => {
  it("invokes onSwipeRight when movement is positive X over threshold", () => {
    const onSwipeRight = vi.fn();
    const onSwipeLeft = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        threshold: 50,
      }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(100, 100));
      result.current.onTouchEnd(mkTouchEvent(200, 100));
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("invokes onSwipeLeft when movement is negative X over threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        threshold: 50,
      }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(200, 100));
      result.current.onTouchEnd(mkTouchEvent(100, 100));
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("invokes onSwipeDown when movement is positive Y over threshold", () => {
    const onSwipeDown = vi.fn();
    const onSwipeUp = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeDown,
        onSwipeUp,
        threshold: 50,
      }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(100, 100));
      result.current.onTouchEnd(mkTouchEvent(100, 200));
    });

    expect(onSwipeDown).toHaveBeenCalledTimes(1);
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("invokes onSwipeUp when movement is negative Y over threshold", () => {
    const onSwipeUp = vi.fn();
    const onSwipeDown = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeDown,
        onSwipeUp,
        threshold: 50,
      }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(100, 200));
      result.current.onTouchEnd(mkTouchEvent(100, 100));
    });

    expect(onSwipeUp).toHaveBeenCalledTimes(1);
    expect(onSwipeDown).not.toHaveBeenCalled();
  });

  it("does not trigger a swipe when under threshold", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeRight, threshold: 50 }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(100, 100));
      result.current.onTouchEnd(mkTouchEvent(120, 100));
    });

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("does not fire on a touch end without a preceding start", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeRight, threshold: 50 }),
    );

    act(() => {
      result.current.onTouchEnd(mkTouchEvent(200, 100));
    });

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("prefers the dominant axis when both deltas are non-trivial", () => {
    const onSwipeRight = vi.fn();
    const onSwipeDown = vi.fn();
    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeRight,
        onSwipeDown,
        threshold: 50,
      }),
    );

    act(() => {
      result.current.onTouchStart(mkTouchEvent(100, 100));
      result.current.onTouchEnd(mkTouchEvent(200, 110));
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeDown).not.toHaveBeenCalled();
  });
});

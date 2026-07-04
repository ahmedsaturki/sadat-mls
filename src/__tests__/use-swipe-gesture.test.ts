import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

function createTouchEvent(
  type: "touchstart" | "touchend",
  touches: Array<{ clientX: number; clientY: number }>
): React.TouchEvent {
  const touchList = touches.map((t) => ({
    clientX: t.clientX,
    clientY: t.clientY,
    pageX: t.clientX,
    pageY: t.clientY,
    screenX: t.clientX,
    screenY: t.clientY,
    identifier: 0,
    target: document.createElement("div"),
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  })) as unknown as React.TouchList;

  return {
    type,
    touches: type === "touchstart" ? touchList : ([] as unknown as React.TouchList),
    changedTouches: touchList,
    targetTouches: type === "touchstart" ? touchList : ([] as unknown as React.TouchList),
    currentTarget: document.createElement("div"),
    target: document.createElement("div"),
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    persist: vi.fn(),
    isPropagationStopped: vi.fn().mockReturnValue(false),
    isDefaultPrevented: vi.fn().mockReturnValue(false),
    timeStamp: Date.now(),
    nativeEvent: {} as TouchEvent,
  } as unknown as React.TouchEvent;
}

describe("useSwipeGesture", () => {
  it("should return onTouchStart and onTouchEnd handlers", () => {
    const { result } = renderHook(() => useSwipeGesture({}));

    expect(result.current.onTouchStart).toBeInstanceOf(Function);
    expect(result.current.onTouchEnd).toBeInstanceOf(Function);
  });

  it("should detect swipe left", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, threshold: 50 }));

    // Start touch
    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    // End touch (moved left)
    const endEvent = createTouchEvent("touchend", [{ clientX: 30, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it("should detect swipe right", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight, threshold: 50 }));

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    const endEvent = createTouchEvent("touchend", [{ clientX: 200, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it("should detect swipe up", () => {
    const onSwipeUp = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeUp, threshold: 50 }));

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 200 }]);
    result.current.onTouchStart(startEvent);

    const endEvent = createTouchEvent("touchend", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeUp).toHaveBeenCalledTimes(1);
  });

  it("should detect swipe down", () => {
    const onSwipeDown = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeDown, threshold: 50 }));

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    const endEvent = createTouchEvent("touchend", [{ clientX: 100, clientY: 200 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeDown).toHaveBeenCalledTimes(1);
  });

  it("should NOT trigger swipe when movement is below threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 50 })
    );

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    // Moved only 30px (below threshold of 50)
    const endEvent = createTouchEvent("touchend", [{ clientX: 70, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("should NOT trigger swipe without touch start", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, threshold: 50 }));

    const endEvent = createTouchEvent("touchend", [{ clientX: 30, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("should use default threshold of 50", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft }));

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    // Moved exactly 50px - should NOT trigger (needs > 50)
    const endEvent = createTouchEvent("touchend", [{ clientX: 50, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("should prioritize horizontal swipe when deltaX > deltaY", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeUp = vi.fn();
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeUp, threshold: 50 })
    );

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    // Moved more left than up
    const endEvent = createTouchEvent("touchend", [{ clientX: 30, clientY: 80 }]);
    result.current.onTouchEnd(endEvent);

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it("should reset touch start after swipe", () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, threshold: 50 }));

    const startEvent = createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]);
    result.current.onTouchStart(startEvent);

    const endEvent = createTouchEvent("touchend", [{ clientX: 30, clientY: 100 }]);
    result.current.onTouchEnd(endEvent);

    // Second swipe without start should not trigger
    const endEvent2 = createTouchEvent("touchend", [{ clientX: 30, clientY: 100 }]);
    result.current.onTouchEnd(endEvent2);

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });
});

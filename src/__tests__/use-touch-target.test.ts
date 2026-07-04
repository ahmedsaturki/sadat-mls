import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTouchTarget,
  useIsTouchDevice,
  useTouchFeedback,
  useClickOutside,
} from "@/hooks/useTouchTarget";

describe("useTouchTarget", () => {
  it("should return a ref, style, and className", () => {
    const { result } = renderHook(() => useTouchTarget());

    expect(result.current.ref).toBeDefined();
    expect(result.current.style).toBeDefined();
    expect(result.current.className).toBe("");
  });

  it("should apply default 44x44px minimum dimensions", () => {
    const { result } = renderHook(() => useTouchTarget());

    expect(result.current.style.minWidth).toBe("44px");
    expect(result.current.style.minHeight).toBe("44px");
  });

  it("should apply custom dimensions", () => {
    const { result } = renderHook(() =>
      useTouchTarget({ minWidth: 48, minHeight: 48 })
    );

    expect(result.current.style.minWidth).toBe("48px");
    expect(result.current.style.minHeight).toBe("48px");
  });

  it("should pass className through", () => {
    const { result } = renderHook(() =>
      useTouchTarget({ className: "my-class" })
    );

    expect(result.current.className).toBe("my-class");
  });

  it("should have inline-flex display style", () => {
    const { result } = renderHook(() => useTouchTarget());

    expect(result.current.style.display).toBe("inline-flex");
    expect(result.current.style.alignItems).toBe("center");
    expect(result.current.style.justifyContent).toBe("center");
  });
});

describe("useIsTouchDevice", () => {
  const originalOntouchstart = (window as Record<string, unknown>).ontouchstart;

  beforeEach(() => {
    // Remove touch support by default for deterministic tests
    delete (window as Record<string, unknown>).ontouchstart;
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalOntouchstart !== undefined) {
      (window as Record<string, unknown>).ontouchstart = originalOntouchstart;
    } else {
      delete (window as Record<string, unknown>).ontouchstart;
    }
  });

  it("should return false on non-touch devices", () => {
    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it("should return true when ontouchstart exists", () => {
    (window as Record<string, unknown>).ontouchstart = {};

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it("should return true when maxTouchPoints > 0", () => {
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: 5,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });
});

describe("useTouchFeedback", () => {
  it("should return isActive as false initially", () => {
    const { result } = renderHook(() => useTouchFeedback());
    expect(result.current.isActive).toBe(false);
  });

  it("should return stable touchProps references across rerenders", () => {
    const { result, rerender } = renderHook(() => useTouchFeedback());

    const firstTouchProps = result.current.touchProps;

    rerender();

    // The handlers are wrapped in useCallback, so they should be stable
    expect(result.current.touchProps.onTouchStart).toBe(firstTouchProps.onTouchStart);
    expect(result.current.touchProps.onTouchEnd).toBe(firstTouchProps.onTouchEnd);
    expect(result.current.touchProps.onMouseDown).toBe(firstTouchProps.onMouseDown);
  });

  it("should set isActive to true on touch start and false on touch end", () => {
    const { result } = renderHook(() => useTouchFeedback());

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.touchProps.onTouchStart();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.touchProps.onTouchEnd();
    });

    expect(result.current.isActive).toBe(false);
  });

  it("should reset on mouse leave", () => {
    const { result } = renderHook(() => useTouchFeedback());

    act(() => {
      result.current.touchProps.onMouseDown();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.touchProps.onMouseLeave();
    });

    expect(result.current.isActive).toBe(false);
  });
});

describe("useClickOutside", () => {
  it("should call handler when clicking outside the ref element", () => {
    const handler = vi.fn();
    const ref = { current: document.createElement("div") };

    renderHook(() => useClickOutside(ref as React.RefObject<HTMLElement | null>, handler));

    const outsideClick = new MouseEvent("mousedown", { bubbles: true });
    document.dispatchEvent(outsideClick);

    expect(handler).toHaveBeenCalled();
  });

  it("should NOT call handler when clicking inside the ref element", () => {
    const handler = vi.fn();
    const element = document.createElement("div");
    const child = document.createElement("span");
    element.appendChild(child);
    const ref = { current: element };

    renderHook(() => useClickOutside(ref as React.RefObject<HTMLElement | null>, handler));

    const insideClick = new MouseEvent("mousedown", { bubbles: true });
    Object.defineProperty(insideClick, "target", { value: child });
    element.dispatchEvent(insideClick);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should respond to touchstart events", () => {
    const handler = vi.fn();
    const ref = { current: document.createElement("div") };

    renderHook(() => useClickOutside(ref as React.RefObject<HTMLElement | null>, handler));

    const outsideTouch = new Event("touchstart", { bubbles: true });
    document.dispatchEvent(outsideTouch);

    expect(handler).toHaveBeenCalled();
  });

  it("should clean up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
    const handler = vi.fn();
    const ref = { current: document.createElement("div") };

    const { unmount } = renderHook(() =>
      useClickOutside(ref as React.RefObject<HTMLElement | null>, handler)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

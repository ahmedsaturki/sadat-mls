import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTouchTarget,
  useIsTouchDevice,
  useTouchFeedback,
  useClickOutside,
} from "@/hooks/useTouchTarget";

describe("useTouchTarget", () => {
  it("returns default 44px minimums via style + ref", () => {
    const { result } = renderHook(() => useTouchTarget());
    expect(result.current.style).toMatchObject({
      minWidth: "44px",
      minHeight: "44px",
    });
    expect(result.current.className).toBe("");
    expect(result.current.ref).toBeDefined();
  });

  it("honors caller overrides", () => {
    const { result } = renderHook(() =>
      useTouchTarget({ minWidth: 60, minHeight: 48, className: "btn" }),
    );
    expect(result.current.style).toMatchObject({
      minWidth: "60px",
      minHeight: "48px",
    });
    expect(result.current.className).toBe("btn");
  });
});

describe("useIsTouchDevice", () => {
  it("returns a boolean", () => {
    const { result } = renderHook(() => useIsTouchDevice());
    expect(typeof result.current).toBe("boolean");
  });

  it("reflects whether the runtime exposes touch capabilities", () => {
    // jsdom exposes `navigator.maxTouchPoints > 0` in some versions, so we can't
    // assert a specific value here. Only the type and the listener wiring are
    // contract-grade.
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useIsTouchDevice());
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    addSpy.mockRestore();
  });
});

describe("useTouchFeedback", () => {
  it("exposes isActive and touchProps pair", () => {
    const { result } = renderHook(() => useTouchFeedback());

    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.touchProps.onTouchStart).toBe("function");
    expect(typeof result.current.touchProps.onTouchEnd).toBe("function");
    expect(typeof result.current.touchProps.onMouseDown).toBe("function");
    expect(typeof result.current.touchProps.onMouseUp).toBe("function");
    expect(typeof result.current.touchProps.onMouseLeave).toBe("function");
    expect(typeof result.current.touchProps.onTouchCancel).toBe("function");
  });

  it("touch start toggles isActive; touch end resets", () => {
    const { result } = renderHook(() => useTouchFeedback());

    act(() => {
      result.current.touchProps.onTouchStart();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.touchProps.onTouchEnd();
    });
    expect(result.current.isActive).toBe(false);
  });

  it("mouse down + leave resets even if mouse up was missed", () => {
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

  it("touchCancel is wired to the touchEnd handler", () => {
    const { result } = renderHook(() => useTouchFeedback());

    act(() => result.current.touchProps.onTouchStart());
    expect(result.current.isActive).toBe(true);

    act(() => result.current.touchProps.onTouchCancel());
    expect(result.current.isActive).toBe(false);
  });
});

describe("useClickOutside", () => {
  it("invokes the handler when click happens outside the ref element", () => {
    const ref: React.RefObject<HTMLDivElement | null> = { current: document.createElement("div") };
    document.body.appendChild(ref.current!);

    const handler = vi.fn();
    renderHook(() => useClickOutside(ref, handler));

    const outside = document.createElement("span");
    document.body.appendChild(outside);

    const event = new MouseEvent("mousedown", { bubbles: true });
    outside.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current!);
    document.body.removeChild(outside);
  });

  it("does not call handler when click happens inside", () => {
    const ref: React.RefObject<HTMLDivElement | null> = { current: document.createElement("div") };
    document.body.appendChild(ref.current!);

    const handler = vi.fn();
    renderHook(() => useClickOutside(ref, handler));

    const inner = document.createElement("span");
    ref.current!.appendChild(inner);

    const event = new MouseEvent("mousedown", { bubbles: true });
    inner.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref.current!);
  });
});

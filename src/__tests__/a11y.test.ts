import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useEscapeKey,
  useAnnounce,
  useKeyboardNavigation,
} from "@/lib/utils/a11y";

describe("useEscapeKey", () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  it("calls callback when Escape is pressed", () => {
    renderHook(() => useEscapeKey(handler));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call callback for other keys", () => {
    renderHook(() => useEscapeKey(handler));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call callback when disabled", () => {
    renderHook(() => useEscapeKey(handler, false));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const { unmount } = renderHook(() => useEscapeKey(handler));

    unmount();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("useAnnounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    el.id = "a11y-announcer";
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.useRealTimers();
    const el = document.getElementById("a11y-announcer");
    if (el) el.remove();
  });

  it("creates announcement in live region", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("Test message");
    });

    const el = document.getElementById("a11y-announcer");
    expect(el?.getAttribute("aria-live")).toBe("polite");

    // Text is set after 100ms timeout
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(el?.textContent).toBe("Test message");
  });

  it("supports assertive priority", () => {
    const { result } = renderHook(() => useAnnounce());

    act(() => {
      result.current.announce("Urgent", "assertive");
    });

    const el = document.getElementById("a11y-announcer");
    expect(el?.getAttribute("aria-live")).toBe("assertive");
  });
});

describe("useKeyboardNavigation", () => {
  it("returns handleKeyDown and currentIndex", () => {
    const items = [
      { id: "1", element: null },
      { id: "2", element: null },
    ];

    const { result } = renderHook(() => useKeyboardNavigation(items));
    expect(typeof result.current.handleKeyDown).toBe("function");
    expect(result.current.currentIndex).toBe(0);
  });

  it("navigates with ArrowDown", () => {
    const elements = [
      document.createElement("button"),
      document.createElement("button"),
    ];
    const items = [
      { id: "1", element: elements[0] },
      { id: "2", element: elements[1] },
    ];

    const { result } = renderHook(() => useKeyboardNavigation(items));

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it("navigates with ArrowUp", () => {
    const elements = [
      document.createElement("button"),
      document.createElement("button"),
    ];
    const items = [
      { id: "1", element: elements[0] },
      { id: "2", element: elements[1] },
    ];

    const { result } = renderHook(() => useKeyboardNavigation(items));

    // Move down first
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    // Move back up
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it("calls onSelect on Enter", () => {
    const onSelect = vi.fn();
    const items = [{ id: "1" }, { id: "2" }];

    const { result } = renderHook(() =>
      useKeyboardNavigation(items, { onSelect })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("wraps around at boundaries", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const { result } = renderHook(() => useKeyboardNavigation(items));

    // Move up from 0 should wrap to last
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.currentIndex).toBe(1);
  });
});

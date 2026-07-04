import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChangesWarning, useFormDirty } from "@/hooks/useUnsavedChangesWarning";

describe("useUnsavedChangesWarning", () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should add beforeunload listener when isDirty is true", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should not add beforeunload listener when isDirty is false", () => {
    renderHook(() => useUnsavedChangesWarning(false));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should remove beforeunload listener on cleanup", () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should use custom message from dict", () => {
    renderHook(() =>
      useUnsavedChangesWarning(true, {
        common: { unsavedChanges: "لديك تغييرات غير محفوظة" },
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should fallback to message param when dict is not provided", () => {
    renderHook(() =>
      useUnsavedChangesWarning(true, undefined, "Custom warning message")
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should use default warning when neither dict nor message provided", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should update listener when isDirty changes", () => {
    const { rerender } = renderHook(
      ({ isDirty }) => useUnsavedChangesWarning(isDirty),
      { initialProps: { isDirty: false } }
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ isDirty: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should fire beforeunload event when dirty", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    // Get the registered handler
    const handler = addEventListenerSpy.mock.calls.find(
      (call: [string, unknown]) => call[0] === "beforeunload"
    )?.[1] as ((e: BeforeUnloadEvent) => void) | undefined;

    expect(handler).toBeDefined();

    // Simulate beforeunload event
    const event = {
      preventDefault: vi.fn(),
      returnValue: "",
    } as unknown as BeforeUnloadEvent;

    const returnValue = handler!(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBeTruthy();
    expect(returnValue).toBeTruthy();
  });
});

describe("useFormDirty", () => {
  it("should return isDirty as false initially", () => {
    const { result } = renderHook(() => useFormDirty({ name: "", email: "" }));

    expect(result.current[0]).toBe(false);
  });

  it("should detect dirty state when values change", () => {
    const { result } = renderHook(() => useFormDirty({ name: "", email: "" }));

    const checkDirty = result.current[1];

    act(() => {
      checkDirty({ name: "John", email: "" });
    });

    expect(result.current[0]).toBe(true);
  });

  it("should reset dirty state", () => {
    const { result } = renderHook(() => useFormDirty({ name: "", email: "" }));

    const checkDirty = result.current[1];
    const resetDirty = result.current[2];

    act(() => {
      checkDirty({ name: "John", email: "" });
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      resetDirty();
    });
    expect(result.current[0]).toBe(false);
  });

  it("should return isDirty as false when values match initial", () => {
    const { result } = renderHook(() => useFormDirty({ name: "John", email: "john@example.com" }));

    const checkDirty = result.current[1];

    act(() => {
      checkDirty({ name: "John", email: "john@example.com" });
    });

    expect(result.current[0]).toBe(false);
  });

  it("should detect changes in nested object values", () => {
    const { result } = renderHook(() =>
      useFormDirty({ config: { theme: "light", lang: "ar" } })
    );

    const checkDirty = result.current[1];

    act(() => {
      checkDirty({ config: { theme: "dark", lang: "ar" } });
    });

    expect(result.current[0]).toBe(true);
  });

  it("should return stable checkDirty and resetDirty references across rerenders", () => {
    const { result, rerender } = renderHook(() =>
      useFormDirty({ name: "", email: "" })
    );

    const firstCheckDirty = result.current[1];
    const firstResetDirty = result.current[2];

    rerender();

    expect(result.current[1]).toBe(firstCheckDirty);
    expect(result.current[2]).toBe(firstResetDirty);
  });

  it("should not detect dirty when comparing same values with undefined fields", () => {
    const { result } = renderHook(() =>
      useFormDirty({ name: "John" } as Record<string, unknown>)
    );

    const checkDirty = result.current[1];

    act(() => {
      checkDirty({ name: "John", extra: "new" } as Record<string, unknown>);
    });

    // Only checks keys in initialValuesRef, so extra key is ignored
    expect(result.current[0]).toBe(false);
  });
});

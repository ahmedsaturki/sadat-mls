import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useUnsavedChangesWarning,
  useFormDirty,
} from "@/hooks/useUnsavedChangesWarning";

describe("useUnsavedChangesWarning", () => {
  it("registers beforeunload listener when isDirty is true", () => {
    const addSpy = vi.spyOn(window, "addEventListener");

    renderHook(() => useUnsavedChangesWarning(true));

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    addSpy.mockRestore();
  });

  it("does NOT register when isDirty is false", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChangesWarning(false));
    const beforeUnloadCalls = addSpy.mock.calls.filter(
      ([type]) => type === "beforeunload",
    );
    expect(beforeUnloadCalls.length).toBe(0);
    addSpy.mockRestore();
  });
});

describe("useFormDirty", () => {
  it("starts as not dirty", () => {
    const initial = { name: "A", email: "a@b.c" };
    const { result } = renderHook(() => useFormDirty(initial));
    expect(result.current[0]).toBe(false);
  });

  it("flags dirty after checkDirty sees a changed field", () => {
    const initial = { name: "A", email: "a@b.c" };
    const { result, rerender } = renderHook(() => useFormDirty(initial));

    act(() => {
      result.current[1]({ name: "B", email: "a@b.c" });
    });

    expect(result.current[0]).toBe(true);
    rerender();
  });

  it("resetDirty clears the dirty flag", () => {
    const initial = { name: "A", email: "a@b.c" };
    const { result } = renderHook(() => useFormDirty(initial));

    act(() => {
      result.current[1]({ name: "B", email: "a@b.c" });
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(false);
  });

  it("does not flip dirty when an unrelated field changes", () => {
    const initial = { name: "A" };
    const { result } = renderHook(() => useFormDirty(initial));

    act(() => {
      result.current[1]({ name: "A" });
    });
    expect(result.current[0]).toBe(false);
  });
});

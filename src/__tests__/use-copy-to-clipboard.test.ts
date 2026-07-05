import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return copied as false initially", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("should return a copy function", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(typeof result.current.copy).toBe("function");
  });

  it("should copy text to clipboard", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy("hello");
    });

    expect(success).toBe(true);
    expect(writeTextSpy).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
  });

  it("should reset copied state after timeout", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useCopyToClipboard(2000));

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should use custom timeout", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });

    // Still copied before timeout
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.copied).toBe(false);
  });

  it("should return false when clipboard write fails", async () => {
    const writeTextSpy = vi.fn().mockRejectedValue(new Error("Clipboard not available"));
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useCopyToClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy("hello");
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it("should reset timer on rapid copy calls", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result } = renderHook(() => useCopyToClipboard(2000));

    await act(async () => {
      await result.current.copy("first");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.copy("second");
    });

    // Still copied (timer reset)
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Still copied (not yet 2000ms since second copy)
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now 2000ms since second copy
    expect(result.current.copied).toBe(false);
  });

  it("should clean up timer on unmount", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { result, unmount } = renderHook(() => useCopyToClipboard(2000));

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(result.current.copied).toBe(true);

    // Unmount before timeout
    unmount();

    // No error should occur after unmount
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});

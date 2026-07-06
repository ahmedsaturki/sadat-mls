import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

describe("useCopyToClipboard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with copied=false", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
    expect(typeof result.current.copy).toBe("function");
  });

  it("flips copied to true after a successful clipboard write", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy("hello");
    });

    expect(result.current.copied).toBe(true);
  });

  it("returns false when copy fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard not available"));
    Object.defineProperty(global.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard(500));
    let ok = true;
    await act(async () => {
      ok = await result.current.copy("hi");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it("calls writeText with the latest copy text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useCopyToClipboard(500));
    await act(async () => {
      await result.current.copy("snip");
    });
    expect(writeText).toHaveBeenCalledWith("snip");
  });
});

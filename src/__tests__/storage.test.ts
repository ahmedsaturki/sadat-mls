import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage, useSessionStorage, useSyncLocalStorage } from "@/hooks/useStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when no stored value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value when available", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("updates stored value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("updated");
  });

  it("updates with function", () => {
    const { result } = renderHook(() => useLocalStorage<number>("test-key", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it("removes stored value", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("test-key")).toBeNull();
  });
});

describe("useSessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns initial value when no stored value", () => {
    const { result } = renderHook(() => useSessionStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value when available", () => {
    sessionStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useSessionStorage("test-key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("updates stored value", () => {
    const { result } = renderHook(() => useSessionStorage("test-key", "default"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(sessionStorage.getItem("test-key")!)).toBe("updated");
  });

  it("removes stored value", () => {
    sessionStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useSessionStorage("test-key", "default"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("default");
    expect(sessionStorage.getItem("test-key")).toBeNull();
  });
});

describe("useSyncLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when no stored value", () => {
    const { result } = renderHook(() => useSyncLocalStorage("sync-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value when available", () => {
    localStorage.setItem("sync-key", JSON.stringify("stored"));
    const { result } = renderHook(() => useSyncLocalStorage("sync-key", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("updates stored value", () => {
    const { result } = renderHook(() => useSyncLocalStorage("sync-key", "default"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("sync-key")!)).toBe("updated");
  });

  it("updates with function", () => {
    const { result } = renderHook(() => useSyncLocalStorage<number>("sync-key", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it("responds to storage events from other tabs", () => {
    const { result } = renderHook(() => useSyncLocalStorage("sync-key", "default"));

    act(() => {
      const event = new StorageEvent("storage", {
        key: "sync-key",
        newValue: JSON.stringify("from-other-tab"),
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe("from-other-tab");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useLocalStorage,
  useSessionStorage,
  useSyncLocalStorage,
} from "@/hooks/useStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("returns initialValue when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("k", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("hydrates from existing storage", () => {
    window.localStorage.setItem("k", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("k", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("falls back to initialValue on corrupted JSON", () => {
    window.localStorage.setItem("k", "{garbage");
    const { result } = renderHook(() => useLocalStorage("k", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("setValue writes to storage", () => {
    const { result } = renderHook(() => useLocalStorage("k", 0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
    expect(JSON.parse(window.localStorage.getItem("k") || "0")).toBe(42);
  });

  it("setValue supports functional updater", () => {
    const { result } = renderHook(() => useLocalStorage("k", 10));

    act(() => {
      result.current[1]((prev: number) => prev + 5);
    });
    expect(result.current[0]).toBe(15);
  });

  it("removeValue clears storage and resets state", () => {
    window.localStorage.setItem("k", JSON.stringify("seed"));
    const { result } = renderHook(() => useLocalStorage("k", "default"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("default");
    expect(window.localStorage.getItem("k")).toBeNull();
  });
});

describe("useSessionStorage", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  it("returns initialValue when session is empty", () => {
    const { result } = renderHook(() => useSessionStorage("k", 0));
    expect(result.current[0]).toBe(0);
  });

  it("hydrates from existing session entry", () => {
    window.sessionStorage.setItem("k", JSON.stringify("hi"));
    const { result } = renderHook(() => useSessionStorage("k", ""));
    expect(result.current[0]).toBe("hi");
  });

  it("setValue writes to session entry", () => {
    const { result } = renderHook(() => useSessionStorage("k", { a: 0 }));

    act(() => {
      result.current[1]({ a: 1 });
    });

    expect(JSON.parse(window.sessionStorage.getItem("k") || "{}")).toEqual({ a: 1 });
  });

  it("removeValue clears session entry", () => {
    window.sessionStorage.setItem("k", JSON.stringify("old"));
    const { result } = renderHook(() => useSessionStorage("k", "default"));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe("default");
    expect(window.sessionStorage.getItem("k")).toBeNull();
  });
});

describe("useSyncLocalStorage", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("returns the initialValue when storage is empty", () => {
    const { result } = renderHook(() => useSyncLocalStorage("k", 0));
    expect(result.current[0]).toBe(0);
  });

  it("persists via setValue", () => {
    const { result } = renderHook(() => useSyncLocalStorage("k", 0));
    act(() => {
      result.current[1](7);
    });
    expect(result.current[0]).toBe(7);
  });

  it("listens for storage events to re-sync state from other tabs", async () => {
    const { result } = renderHook(() => useSyncLocalStorage("k", 0));
    expect(result.current[0]).toBe(0);

    act(() => {
      window.localStorage.setItem("k", JSON.stringify(99));
      window.dispatchEvent(
        new StorageEvent("storage", {
            key: "k",
            newValue: JSON.stringify(99),
            oldValue: JSON.stringify(0),
            storageArea: window.localStorage,
          }),
        );
    });

    expect(result.current[0]).toBe(99);
  });
});

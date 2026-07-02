import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("renders fallback UI when error occurs", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/An error occurred/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeDefined();

    consoleSpy.mockRestore();
  });

  it("renders custom fallback title and message", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Custom Title" fallbackMessage="Custom message">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Title")).toBeDefined();
    expect(screen.getByText("Custom message")).toBeDefined();

    consoleSpy.mockRestore();
  });

  it("retry button clears error state and re-renders children", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let errorMessage = "boom";
    const ToggleChild = () => {
      if (errorMessage) throw new Error(errorMessage);
      return <div>OK</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleChild />
      </ErrorBoundary>
    );

    expect(screen.getByText(/An error occurred/i)).toBeDefined();

    errorMessage = "";
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

    rerender(
      <ErrorBoundary>
        <ToggleChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("OK")).toBeDefined();
    expect(screen.queryByText(/An error occurred/i)).toBeNull();
    consoleSpy.mockRestore();
  });

  it("shows AlertTriangle icon in fallback", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();

    consoleSpy.mockRestore();
  });
});

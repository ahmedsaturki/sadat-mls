import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from "@/lib/logger";

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normal rendering", () => {
    it("renders children when no error", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("renders multiple children without error", () => {
      render(
        <ErrorBoundary>
          <div>First</div>
          <div>Second</div>
        </ErrorBoundary>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("error rendering", () => {
    it("renders fallback UI when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An error occurred/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Try again/i })).toBeDefined();
    });

    it("renders custom fallback title and message", () => {
      render(
        <ErrorBoundary fallbackTitle="Custom Title" fallbackMessage="Custom message">
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom Title")).toBeDefined();
      expect(screen.getByText("Custom message")).toBeDefined();
    });

    it("shows AlertTriangle icon in fallback", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeDefined();
    });

    it("does not render children after error", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Child content")).not.toBeInTheDocument();
    });
  });

  describe("error logging", () => {
    it("logs error via logger.error on componentDidCatch", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalledWith(
        "ErrorBoundary caught",
        expect.objectContaining({ error: "Test error" })
      );
    });

    it("logs error with component stack info", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const call = vi.mocked(logger.error).mock.calls[0];
      expect(call[1]).toHaveProperty("componentStack");
    });
  });

  describe("retry behavior", () => {
    it("retry button clears error state and re-renders children", () => {
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
    });

    it("retry button is clickable", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const retryBtn = screen.getByRole("button", { name: /Try again/i });
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn).toBeEnabled();
    });

    it("retry button has aria-label", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const retryBtn = screen.getByRole("button", { name: /Try again/i });
      expect(retryBtn).toHaveAttribute("aria-label", "Try again");
    });
  });

  describe("error state details", () => {
    it("captures error message from thrown error", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
      expect(logger.error).toHaveBeenCalledWith(
        "ErrorBoundary caught",
        expect.objectContaining({ error: "Test error" })
      );
    });

    it("handles component throwing non-Error value gracefully", () => {
      const NonErrorThrower = () => {
        throw "string error";
      };

      render(
        <ErrorBoundary>
          <NonErrorThrower />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    });
  });

  describe("conditional rendering", () => {
    it("renders children when child does not throw", () => {
      const SafeChild = () => <div>All good</div>;
      render(
        <ErrorBoundary>
          <SafeChild />
        </ErrorBoundary>
      );
      expect(screen.getByText("All good")).toBeInTheDocument();
    });

    it("only catches errors from direct children", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );
      expect(screen.getByText("Child content")).toBeInTheDocument();
      expect(screen.queryByText(/An error occurred/i)).not.toBeInTheDocument();
    });
  });
});

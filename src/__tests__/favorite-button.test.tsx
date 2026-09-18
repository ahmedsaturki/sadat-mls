import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import FavoriteButton from "@/components/properties/FavoriteButton";

describe("FavoriteButton", () => {
  it("renders disabled while favorites persistence is retired", () => {
    render(<FavoriteButton propertyId="prop-1" userId="user-1" />);
    const button = screen.getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("uses the dictionary favorites label when available", () => {
    const mockDict = {
      common: {
        favorites: "Favorites",
      },
    };

    render(<FavoriteButton propertyId="prop-1" dict={mockDict as never} />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-label", "Favorites");
    expect(button).toHaveAttribute("title", "Favorites");
  });

  it("falls back to a stable favorites label", () => {
    render(<FavoriteButton propertyId="prop-1" />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-label", "Favorites");
    expect(button).toHaveAttribute("title", "Favorites");
  });

  it("does not provide a login redirect because the control is non-interactive", () => {
    render(<FavoriteButton propertyId="prop-1" userId={null} />);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
  });

  it("uses the requested small and large size classes", () => {
    const { rerender } = render(<FavoriteButton propertyId="prop-1" size="sm" />);
    expect(screen.getByRole("button")).toHaveClass("w-8", "h-8");

    rerender(<FavoriteButton propertyId="prop-1" size="lg" />);
    expect(screen.getByRole("button")).toHaveClass("w-12", "h-12");
  });

  it("preserves caller className while remaining visibly disabled", () => {
    render(<FavoriteButton propertyId="prop-1" className="custom-class" />);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("custom-class", "cursor-not-allowed");
    expect(button).toBeDisabled();
  });
});

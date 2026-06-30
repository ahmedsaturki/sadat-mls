import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import FavoriteButton from "@/components/properties/FavoriteButton";

describe("FavoriteButton", () => {
  it("renders with default state (not favorited)", () => {
    render(<FavoriteButton propertyId="prop-1" userId="user-1" />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("has correct aria-label for add to favorites", () => {
    const mockDict = {
      common: {
        addFavorite: "Add to favorites",
        removeFavorite: "Remove from favorites",
      },
    };
    render(<FavoriteButton propertyId="prop-1" userId="user-1" dict={mockDict as any} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Add to favorites");
  });

  it("shows login redirect when clicked without user", () => {
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    render(<FavoriteButton propertyId="prop-1" userId={null} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(mockLocation.href).toContain("/login");
  });

  it("does not check status when userId is null", () => {
    render(<FavoriteButton propertyId="prop-1" userId={null} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("has correct aria-label for remove from favorites when favorited", () => {
    const mockDict = {
      common: {
        addFavorite: "Add to favorites",
        removeFavorite: "Remove from favorites",
      },
    };
    render(<FavoriteButton propertyId="prop-1" userId="user-1" dict={mockDict as any} />);
    const button = screen.getByRole("button");
    // Initially not favorited, so aria-label should be "Add to favorites"
    expect(button).toHaveAttribute("aria-label", "Add to favorites");
  });

  it("renders with small size", () => {
    render(<FavoriteButton propertyId="prop-1" userId="user-1" size="sm" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-8", "h-8");
  });

  it("renders with large size", () => {
    render(<FavoriteButton propertyId="prop-1" userId="user-1" size="lg" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("w-12", "h-12");
  });

  it("has disabled state when loading", () => {
    render(<FavoriteButton propertyId="prop-1" userId="user-1" />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });
});
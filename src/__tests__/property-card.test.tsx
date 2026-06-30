import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/components/properties/FavoriteButton", () => ({
  default: ({ propertyId, userId }: { propertyId: string; userId?: string | null }) => (
    <button data-testid="favorite-button" data-property-id={propertyId} data-user-id={userId || ""}>
      Favorite
    </button>
  ),
}));

vi.mock("@/components/properties/ShareButton", () => ({
  default: () => <button>Share</button>,
}));

import PropertyCard from "@/components/properties/PropertyCard";

describe("PropertyCard", () => {
  it("renders property information", () => {
    render(
      <PropertyCard
        id="prop-1"
        title="Test Property"
        price={1000000}
        area={120}
        bedrooms={3}
        bathrooms={2}
        zone="Test Zone"
        status="available"
        officeName="Test Office"
        locale="ar"
      />
    );

    expect(screen.getByText("Test Property")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders FavoriteButton with userId when provided", () => {
    render(
      <PropertyCard
        id="prop-1"
        title="Test Property"
        price={1000000}
        area={120}
        status="available"
        officeName="Test Office"
        locale="ar"
        userId="user-123"
      />
    );

    const favBtn = screen.getByTestId("favorite-button");
    expect(favBtn).toBeInTheDocument();
    expect(favBtn).toHaveAttribute("data-property-id", "prop-1");
    expect(favBtn).toHaveAttribute("data-user-id", "user-123");
  });

  it("renders FavoriteButton without userId when undefined", () => {
    render(
      <PropertyCard
        id="prop-1"
        title="Test Property"
        price={1000000}
        area={120}
        status="available"
        officeName="Test Office"
        locale="ar"
      />
    );

    const favBtn = screen.getByTestId("favorite-button");
    expect(favBtn).toBeInTheDocument();
  });
});
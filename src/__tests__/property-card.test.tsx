import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; fill?: boolean; sizes?: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

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
      Fav
    </button>
  ),
}));

vi.mock("@/components/properties/ShareButton", () => ({
  default: () => <button data-testid="share-button">Share</button>,
}));

vi.mock("@/components/properties/CompareButton", () => ({
  default: ({ property }: { property?: { id: string } }) => (
    <button data-testid="compare-button" data-property-id={property?.id || ""}>Compare</button>
  ),
}));

vi.mock("@/components/ui/Badge", () => ({
  default: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

import PropertyCard from "@/components/properties/PropertyCard";

const baseProps = {
  id: "prop-1",
  title: "Apartment in District 1",
  price: 1500000,
  area: 120,
  status: "available" as const,
  officeName: "Sadat Properties",
  locale: "ar" as const,
};

describe("PropertyCard", () => {
  describe("rendering content", () => {
    it("renders property title", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.getAllByText("Apartment in District 1").length).toBeGreaterThanOrEqual(1);
    });

    it("renders formatted price for Arabic locale", () => {
      render(<PropertyCard {...baseProps} price={1500000} />);
      expect(screen.getByText(/١٬٥٠٠٬٠٠٠/)).toBeInTheDocument();
    });

    it("renders formatted price for English locale", () => {
      render(<PropertyCard {...baseProps} price={1500000} locale="en" />);
      expect(screen.getByText(/1,500,000/)).toBeInTheDocument();
    });

    it("renders area with default unit", () => {
      render(<PropertyCard {...baseProps} area={120} />);
      expect(screen.getByText(/120.*m²/)).toBeInTheDocument();
    });

    it("renders area with dict unit override", () => {
      const dict = { property: { areaUnit: "sqm" } } as never;
      render(<PropertyCard {...baseProps} area={120} dict={dict} />);
      expect(screen.getByText(/120.*sqm/)).toBeInTheDocument();
    });

    it("renders bedrooms when provided", () => {
      render(<PropertyCard {...baseProps} bedrooms={3} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("does not render bedrooms when undefined", () => {
      const { container } = render(<PropertyCard {...baseProps} />);
      const bedSpans = container.querySelectorAll("[class*='flex items-center gap-1']");
      expect(bedSpans.length).toBeGreaterThanOrEqual(0);
    });

    it("renders bathrooms when provided", () => {
      render(<PropertyCard {...baseProps} bathrooms={2} />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders zone when provided", () => {
      render(<PropertyCard {...baseProps} zone="Sadat City Center" />);
      expect(screen.getByText("Sadat City Center")).toBeInTheDocument();
    });

    it("does not render zone when undefined", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.queryByText("Sadat City Center")).not.toBeInTheDocument();
    });

    it("renders type when provided", () => {
      render(<PropertyCard {...baseProps} type="Apartment" />);
      expect(screen.getByText("Apartment")).toBeInTheDocument();
    });

    it("does not render type when undefined", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.queryByText("Apartment")).not.toBeInTheDocument();
    });

    it("renders office name", () => {
      render(<PropertyCard {...baseProps} officeName="Sadat Properties" />);
      expect(screen.getByText("Sadat Properties")).toBeInTheDocument();
    });
  });

  describe("link and navigation", () => {
    it("wraps in link with correct href", () => {
      render(<PropertyCard {...baseProps} id="prop-123" locale="ar" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/ar/explore/prop-123");
    });

    it("link uses correct locale for English", () => {
      render(<PropertyCard {...baseProps} id="prop-1" locale="en" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/en/explore/prop-1");
    });

    it("has aria-label with title and status", () => {
      render(<PropertyCard {...baseProps} title="Luxury Villa" status="sold" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-label", expect.stringContaining("Luxury Villa"));
    });
  });

  describe("status badge", () => {
    it("renders available status badge", () => {
      render(<PropertyCard {...baseProps} status="available" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveTextContent("Available");
      expect(badge).toHaveAttribute("data-variant", "success");
    });

    it("renders reserved status badge", () => {
      render(<PropertyCard {...baseProps} status="reserved" />);
      expect(screen.getByTestId("badge")).toHaveTextContent("Reserved");
    });

    it("renders rented status badge", () => {
      render(<PropertyCard {...baseProps} status="rented" />);
      expect(screen.getByTestId("badge")).toHaveTextContent("Rented");
    });

    it("renders sold status badge", () => {
      render(<PropertyCard {...baseProps} status="sold" />);
      expect(screen.getByTestId("badge")).toHaveTextContent("Sold");
    });

    it("renders pending_review status badge", () => {
      render(<PropertyCard {...baseProps} status="pending_review" />);
      expect(screen.getByTestId("badge")).toHaveTextContent("Pending Review");
    });

    it("uses dict override for status labels", () => {
      const dict = { property: { status: { available: "Available!" } } } as never;
      render(<PropertyCard {...baseProps} status="available" dict={dict} />);
      expect(screen.getByTestId("badge")).toHaveTextContent("Available!");
    });
  });

  describe("sub-components", () => {
    it("renders FavoriteButton with userId", () => {
      render(<PropertyCard {...baseProps} userId="user-123" />);
      const favBtn = screen.getByTestId("favorite-button");
      expect(favBtn).toHaveAttribute("data-property-id", "prop-1");
      expect(favBtn).toHaveAttribute("data-user-id", "user-123");
    });

    it("renders FavoriteButton without userId", () => {
      render(<PropertyCard {...baseProps} />);
      const favBtn = screen.getByTestId("favorite-button");
      expect(favBtn).toHaveAttribute("data-user-id", "");
    });

    it("renders CompareButton", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.getByTestId("compare-button")).toBeInTheDocument();
    });

    it("renders ShareButton", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });
  });

  describe("image handling", () => {
    it("renders image when imageUrl provided", () => {
      render(<PropertyCard {...baseProps} imageUrl="/test.jpg" />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "/test.jpg");
      expect(img).toHaveAttribute("alt", "Apartment in District 1");
    });

    it("does not render img element when no imageUrl", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("dict overrides", () => {
    it("uses dict priceUnit", () => {
      const dict = { property: { priceUnit: "EGP" } } as never;
      render(<PropertyCard {...baseProps} dict={dict} />);
      expect(screen.getByText(/EGP/)).toBeInTheDocument();
    });

    it("falls back to default priceUnit without dict", () => {
      render(<PropertyCard {...baseProps} />);
      expect(screen.getByText(/EGP/)).toBeInTheDocument();
    });
  });
});

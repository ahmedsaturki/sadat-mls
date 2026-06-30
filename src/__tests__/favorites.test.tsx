import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/hooks/useAuthUser", () => ({
  useAuthUser: () => ({
    user: null,
    profile: null,
  }),
}));

vi.mock("@/i18n/getMessages", () => ({
  getMessages: () => ({
    common: {
      favorites: "المفضلة",
      noFavorites: "لا توجد عقارات مفضلة",
      addFavoritesHint: "أضف عقارات إلى المفضلة لوجودها هنا",
    },
  }),
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/properties/PropertyCard", () => ({
  default: () => <div data-testid="property-card">Property Card</div>,
}));

vi.mock("@/components/ui/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Skeleton", () => ({
  SkeletonCard: () => <div>Loading skeleton</div>,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ data: [], error: null }),
        in: () => ({ data: [], error: null }),
      }),
    }),
  }),
}));

import FavoritesPageWrapper from "@/app/[locale]/dashboard/favorites/page";

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("renders favorites heading", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    expect(screen.getByText("المفضلة")).toBeInTheDocument();
  });

  it("displays empty state when no user is logged in", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    expect(screen.getByText("لا توجد عقارات مفضلة")).toBeInTheDocument();
  });
});
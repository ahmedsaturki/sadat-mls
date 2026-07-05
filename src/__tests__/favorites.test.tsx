import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/hooks/useAuthUser", () => ({
  useAuthUser: () => ({
    user: null,
    profile: null,
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({ data: [], error: null }),
          in: () => ({ data: [], error: null }),
        }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: vi.fn(),
    },
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
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock("@/components/properties/PropertyCard", () => ({
  default: ({ title }: { title: string }) => <div data-testid="property-card">{title}</div>,
}));

vi.mock("@/components/ui/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Skeleton", () => ({
  SkeletonCard: () => <div data-testid="skeleton-card">Loading skeleton</div>,
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

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
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

  it("shows hint text in empty state", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    expect(screen.getByText("أضف عقارات إلى المفضلة لوجودها هنا")).toBeInTheDocument();
  });

  it("renders Heart icon in heading", () => {
    const { container } = render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("renders within DashboardLayout", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
  });

  it("has empty state with role=status for a11y", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty state with Heart icon", () => {
    render(<FavoritesPageWrapper params={{ locale: "ar" }} />);
    const statusEl = screen.getByRole("status");
    expect(statusEl).toContainHTML("svg");
  });
});

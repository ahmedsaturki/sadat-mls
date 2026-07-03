import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock "server-only" — Next.js internal module, not available in Vitest
vi.mock("server-only", () => ({}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/ar/test",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "ar" }),
}));

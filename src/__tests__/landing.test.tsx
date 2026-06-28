import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Messages } from "@/i18n/getMessages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ limit: () => ({ single: () => ({ data: { id: "1" }, error: null }) }) }) }),
      insert: () => ({ error: null }),
    }),
  }),
}));

import ContactForm from "@/components/landing/ContactForm";
import LandingHero from "@/components/landing/LandingHero";

const mockDict = {
  common: { close: "Close", login: "Login" },
  landing: {
    hero: "Find Your Dream Property",
    heroSubtitle: "Best Properties in Sadat City",
    heroDescription: "Browse our listings",
    heroBadge: "New",
    searchPlaceholder: "Search properties...",
    viewAll: "View All",
    contactForm: {
      title: "Contact Us",
      subtitle: "We'd love to hear from you",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      phone: "Phone",
      phonePlaceholder: "Your phone",
      message: "Message",
      messagePlaceholder: "Your message",
      send: "Send Message",
      sending: "Sending...",
      success: "Message sent!",
      error: "Failed to send. Please try again.",
    },
  },
} as unknown as Messages;

describe("ContactForm", () => {
  it("renders all form fields with correct htmlFor/id", () => {
    render(<ContactForm dict={mockDict} />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("id", "contact-name");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "contact-email");
    expect(screen.getByLabelText("Phone")).toHaveAttribute("id", "contact-phone");
    expect(screen.getByLabelText("Message")).toHaveAttribute("id", "contact-message");
  });

  it("renders form title and subtitle", () => {
    render(<ContactForm dict={mockDict} />);
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("We'd love to hear from you")).toBeInTheDocument();
  });

  it("renders submit button with Send icon", () => {
    render(<ContactForm dict={mockDict} />);
    expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument();
  });

  it("requires name and message fields", () => {
    render(<ContactForm dict={mockDict} />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("required");
    expect(screen.getByLabelText("Message")).toHaveAttribute("required");
  });
});

describe("LandingHero", () => {
  it("renders hero content", () => {
    render(<LandingHero locale="ar" dict={mockDict} />);
    expect(screen.getByText("Find Your Dream Property")).toBeInTheDocument();
    expect(screen.getByText("Best Properties in Sadat City")).toBeInTheDocument();
  });

  it("renders search input with aria-label", () => {
    render(<LandingHero locale="ar" dict={mockDict} />);
    const searchInput = screen.getByPlaceholderText("Search properties...");
    expect(searchInput).toHaveAttribute("aria-label", "Search properties...");
  });

  it("renders search submit button with aria-label", () => {
    render(<LandingHero locale="ar" dict={mockDict} />);
    const submitButton = screen.getByRole("button", { name: "Search" });
    expect(submitButton).toBeInTheDocument();
  });

  it("renders view all and login links", () => {
    render(<LandingHero locale="ar" dict={mockDict} />);
    expect(screen.getByText("View All")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});

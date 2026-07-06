import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationsBell from "@/components/layout/NotificationsBell";

const SAMPLE_DICT = {
  notifications: {
    title: "Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications",
    contactRequest: "Contact Request",
    propertyInquiry: "Property Inquiry",
    agentJoined: "Agent Joined",
    system: "System",
    timeAgo: {
      justNow: "Just now",
      minutesAgo: "{{count}}m ago",
      hoursAgo: "{{count}}h ago",
      daysAgo: "{{count}}d ago",
    },
  },
};

function makeJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("NotificationsBell component", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the bell button with an aria-label that includes unread count", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({ notifications: [], unreadCount: 0 }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);

    const bell = await screen.findByRole("button", {
      name: /Notifications \(0 unread\)/i,
    });
    expect(bell).toBeInTheDocument();
  });

  it("fetches notifications on mount", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({
        notifications: [
          {
            id: "1",
            type: "contact_request",
            title: "Inquiry",
            message: "Hello",
            entity_type: "property",
            entity_id: null,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const called = fetchMock.mock.calls[0];
    expect(called[0]).toContain("/api/notifications");
  });

  it("opens the dropdown on bell click", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({ notifications: [], unreadCount: 0 }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  });

  it("shows 'noNotifications' message when list is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({ notifications: [], unreadCount: 0 }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });

  it("renders notification titles fetched from the API", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({
        notifications: [
          {
            id: "n1",
            type: "contact_request",
            title: "New property inquiry",
            message: "Hello world",
            entity_type: "property",
            entity_id: null,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      }),
    );

    render(<NotificationsBell locale="en" dict={SAMPLE_DICT} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("New property inquiry")).toBeInTheDocument();
    });
  });

  it("shows the unread badge when unreadCount > 0", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({
        notifications: [],
        unreadCount: 7,
      }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);
    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("displays 9+ when unreadCount is greater than 9", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({
        notifications: [],
        unreadCount: 12,
      }),
    );

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);
    await waitFor(() => {
      expect(screen.getByText("9+")).toBeInTheDocument();
    });
  });

  it("swallows fetch errors and keeps the bell rendered", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));

    render(<NotificationsBell locale="ar" dict={SAMPLE_DICT} />);

    const bell = await screen.findByRole("button");
    expect(bell).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});

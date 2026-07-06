"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEscapeKey } from "@/lib/utils/a11y";
import { logger } from "@/lib/logger";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsBellProps {
  locale: string;
  dict: {
    notifications: {
      title: string;
      markAllRead: string;
      noNotifications: string;
      contactRequest: string;
      propertyInquiry: string;
      agentJoined: string;
      system: string;
      timeAgo?: {
        justNow?: string;
        minutesAgo?: string;
        hoursAgo?: string;
        daysAgo?: string;
      };
    };
  };
}

export default function NotificationsBell({ locale, dict }: NotificationsBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useEscapeKey(closeDropdown, isOpen);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      logger.error("Failed to fetch notifications", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark as read
  const markAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (err) {
      logger.error("Failed to mark notifications as read", { error: err instanceof Error ? err.message : String(err) });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      logger.error("Failed to mark all notifications as read", { error: err instanceof Error ? err.message : String(err) });
    }
  };

  // Get notification type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "contact_request":
        return dict.notifications.contactRequest;
      case "property_inquiry":
        return dict.notifications.propertyInquiry;
      case "agent_joined":
        return dict.notifications.agentJoined;
      case "system":
        return dict.notifications.system;
      default:
        return type;
    }
  };

  // Get notification type color
  const getTypeColor = (type: string): string => {
    switch (type) {
      case "contact_request":
        return "bg-blue-100 text-blue-800";
      case "property_inquiry":
        return "bg-green-100 text-green-800";
      case "agent_joined":
        return "bg-purple-100 text-purple-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const timeAgo = dict.notifications.timeAgo ?? {};

    if (diffMins < 1) return timeAgo.justNow ?? (locale === "ar" ? "الآن" : "Just now");
    const minutesAgoTemplate = timeAgo.minutesAgo;
    if (minutesAgoTemplate) {
      return minutesAgoTemplate.replace("{{count}}", String(diffMins));
    }
    if (diffMins < 60) {
      return locale === "ar"
        ? `منذ ${diffMins} دقيقة`
        : `${diffMins}m ago`;
    }
    const hoursAgoTemplate = timeAgo.hoursAgo;
    if (hoursAgoTemplate) {
      return hoursAgoTemplate.replace("{{count}}", String(diffHours));
    }
    if (diffHours < 24) {
      return locale === "ar"
        ? `منذ ${diffHours} ساعة`
        : `${diffHours}h ago`;
    }
    const daysAgoTemplate = timeAgo.daysAgo;
    if (daysAgoTemplate) {
      return daysAgoTemplate.replace("{{count}}", String(diffDays));
    }
    if (diffDays < 7) {
      return locale === "ar"
        ? `منذ ${diffDays} يوم`
        : `${diffDays}d ago`;
    }
    return new Date(dateStr).toLocaleDateString(locale);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        )}
        aria-label={`${dict.notifications.title} (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            `absolute mt-2 w-80 max-h-96 overflow-hidden ${locale === "en" ? "right-0" : "left-0"}`,
            "bg-white rounded-xl shadow-lg border border-gray-200",
            "z-50"
          )}
          role="menu"
          aria-label={dict.notifications.title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {dict.notifications.title}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <CheckCheck className="w-3 h-3" aria-hidden="true" />
                {dict.notifications.markAllRead}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-72">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {dict.notifications.noNotifications}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-50 last:border-0",
                    "hover:bg-gray-50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-blue-50/50"
                  )}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead([notification.id]);
                    }
                  }}
                  role="menuitem"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          getTypeColor(notification.type)
                        )}
                      >
                        {getTypeLabel(notification.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

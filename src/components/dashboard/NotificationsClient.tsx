"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowLeft, MessageCircle, Home, UserPlus, Settings } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import Button from "@/components/ui/Button";
import { type Locale } from "@/i18n/config";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  title_params?: string | Record<string, string | number> | null;
  message_params?: string | Record<string, string | number> | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  contact_request: MessageCircle,
  property_inquiry: Home,
  agent_joined: UserPlus,
  system: Settings,
};

export default function NotificationsClient({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const mountedRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setNotifications(data.notifications || []);
      }
    } catch (err) {
      logger.error("Failed to load notifications", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();
    return () => { mountedRef.current = false; };
  }, [loadNotifications]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      logger.error("Failed to mark notifications", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setMarkingAll(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // Silent fail
    }
  };

  const getIcon = (type: string) => {
    return TYPE_ICONS[type] || Bell;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return dict.dashboard.justNow;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString(typedLocale === "ar" ? "ar-EG" : "en-US");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dict.nav.notifications}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} {dict.dashboard.unread}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              isLoading={markingAll}
            >
              <CheckCheck className="w-4 h-4 ms-2" />
              {dict.nav.markAllRead}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2" role="list" aria-label={dict.nav.notifications}>
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <button
                  key={notification.id}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`w-full text-start p-4 rounded-xl transition-colors ${
                    notification.is_read
                      ? "bg-white hover:bg-gray-50"
                      : "bg-navy-50 hover:bg-navy-100 border border-navy-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? "bg-gray-100" : "bg-navy-100"
                    }`}>
                      <Icon className={`w-5 h-5 ${notification.is_read ? "text-gray-500" : "text-navy-600"}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${notification.is_read ? "text-gray-700" : "text-gray-900"}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-navy-600 rounded-full flex-shrink-0" aria-label="Unread" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-500" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {dict.dashboard.noNotifications}
            </h2>
            <p className="text-sm text-gray-500">
              {dict.dashboard.noNotificationsDesc}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

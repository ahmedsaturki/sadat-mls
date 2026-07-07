"use client";

import { useState, useEffect } from "react";
import { Home, UserPlus, Mail, Settings, Trash2, Edit, Eye, Plus, Clock } from "lucide-react";
import { logger } from "@/lib/logger";
import type { Messages } from "@/i18n/getMessages";

interface ActivityUser {
  full_name: string | null;
  email: string | null;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  users?: ActivityUser | null;
}

interface ActivityFeedProps {
  locale?: string;
  dict: Messages;
  officeId?: string;
}

const ACTION_ICONS: Record<string, typeof Home> = {
  "property.created": Plus,
  "property.updated": Edit,
  "property.deleted": Trash2,
  "agent.created": UserPlus,
  "agent.deleted": Trash2,
  "contact_request.updated": Mail,
  "office.updated": Settings,
};

const ACTION_COLORS: Record<string, string> = {
  "property.created": "bg-green-100 text-green-600",
  "property.updated": "bg-blue-100 text-blue-600",
  "property.deleted": "bg-red-100 text-red-600",
  "agent.created": "bg-purple-100 text-purple-600",
  "agent.deleted": "bg-red-100 text-red-600",
  "contact_request.updated": "bg-orange-100 text-orange-600",
  "office.updated": "bg-gray-100 text-gray-600",
};

function formatAction(action: string, dict: Messages): string {
  const actionMap: Record<string, string> = {
    "property.created": dict.office?.activityPropertyCreated || "Created a property",
    "property.updated": dict.office?.activityPropertyUpdated || "Updated a property",
    "property.deleted": dict.office?.activityPropertyDeleted || "Deleted a property",
    "agent.created": dict.office?.activityAgentCreated || "Added a team member",
    "agent.deleted": dict.office?.activityAgentDeleted || "Removed a team member",
    "contact_request.updated": dict.office?.activityContactUpdated || "Updated a contact request",
    "office.updated": dict.office?.activityOfficeUpdated || "Updated office settings",
  };
  return actionMap[action] || action;
}

function timeAgo(dateStr: string, dict: Messages): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return dict.common?.timeAgo?.justNow || "Just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return (dict.common?.timeAgo?.minutesAgo || "{{count}} min ago").replace("{{count}}", String(mins));
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return (dict.common?.timeAgo?.hoursAgo || "{{count}} hours ago").replace("{{count}}", String(hours));
  }
  const days = Math.floor(seconds / 86400);
  return (dict.common?.timeAgo?.daysAgo || "{{count}} days ago").replace("{{count}}", String(days));
}

export default function ActivityFeed({ dict }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activity?limit=10");
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        logger.error("Failed to fetch activities", { error: err instanceof Error ? err.message : String(err) });
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-200 rounded w-1/2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
        <p className="text-gray-400 text-sm">
          {dict.office?.noActivity || "No recent activity"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1" role="log" aria-label={dict.office?.recentActivity || "Recent activity"}>
      {activities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || Eye;
        const colorClass = ACTION_COLORS[activity.action] || "bg-gray-100 text-gray-600";
        const userName = activity.users?.full_name || activity.users?.email || (dict.common?.unknown || "Unknown");

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{userName}</span>{" "}
                {formatAction(activity.action, dict)}
                {activity.entity_title && (
                  <span className="text-gray-500"> — {activity.entity_title}</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {timeAgo(activity.created_at, dict)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

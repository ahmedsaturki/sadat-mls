"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MessageSquare, ExternalLink, Inbox } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";

interface ContactRequest {
  id: string;
  property_id: string;
  contact_type: "whatsapp" | "phone" | "email";
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  message: string | null;
  created_at: string;
  properties: { title: string } | null;
}

export default function ContactRequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const dict = getMessages(locale);

  const mountedRef = useRef(true);

  const loadRequests = useCallback(async () => {
    try {
      if (!user || !mountedRef.current) {
        router.push(`/${locale}/login`);
        return;
      }

      if (!profile?.office_id) {
        router.push(`/${locale}/explore`);
        return;
      }

      const { data, error: requestsError } = await supabase
        .from("contact_requests")
        .select("*, properties(title)")
        .eq("office_id", profile.office_id)
        .order("created_at", { ascending: false });

      if (requestsError) {
        showToast(requestsError.message, "error");
      } else {
        setRequests(data || []);
      }
    } catch (err) {
      logger.error("Failed to fetch contact requests", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast, locale, router, dict.common.unexpectedError, user, profile]);

  useEffect(() => {
    mountedRef.current = true;
    if (user && profile) {
      loadRequests();
    }
    return () => { mountedRef.current = false; };
  }, [loadRequests, user, profile]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "phone": return <Phone className="w-4 h-4 text-blue-600" />;
      case "email": return <Mail className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "whatsapp": return dict.contactRequests.whatsapp;
      case "phone": return dict.contactRequests.phone;
      case "email": return dict.contactRequests.email;
      default: return type;
    }
  };

  const filteredRequests = filter === "all"
    ? requests
    : requests.filter(r => r.contact_type === filter);

  const counts = {
    all: requests.length,
    whatsapp: requests.filter(r => r.contact_type === "whatsapp").length,
    phone: requests.filter(r => r.contact_type === "phone").length,
    email: requests.filter(r => r.contact_type === "email").length,
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.contactRequests.title}
            action={
              <span className="text-sm text-gray-500">{filteredRequests.length} {dict.contactRequests.requestsCount}</span>
            }
          />

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "whatsapp", "phone", "email"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                aria-pressed={filter === type}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type !== "all" && getTypeIcon(type)}
                {type === "all" ? dict.common.all : getTypeLabel(type)}
                <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs">{counts[type]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.contact_type)}
                          <Badge>{getTypeLabel(request.contact_type)}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                        </span>
                      </div>
                      {request.visitor_name && (
                        <p className="text-sm font-medium text-gray-900">{request.visitor_name}</p>
                      )}
                      {request.visitor_phone && (
                        <p className="text-sm text-gray-600">{request.visitor_phone}</p>
                      )}
                      {request.visitor_email && (
                        <p className="text-sm text-gray-600">{request.visitor_email}</p>
                      )}
                      {request.message && (
                        <p className="text-sm text-gray-500 mt-1">{request.message}</p>
                      )}
                      {request.properties && (
                        <p className="text-xs text-gray-400 mt-1">{dict.contactRequests.property}: {request.properties.title}</p>
                      )}
                    </div>
                    {request.visitor_phone && (
                      <a
                        href={request.contact_type === "whatsapp" ? `https://wa.me/${request.visitor_phone}` : `tel:${request.visitor_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {dict.contactRequests.view}
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm" role="status">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">{dict.contactRequests.noRequests}</p>
              <p className="text-sm text-gray-400">{dict.contactRequests.noRequestsHint}</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MessageSquare, ExternalLink, Building2, Trash2, Filter, Inbox } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";

interface ContactRequest {
  id: string;
  property_id: string;
  office_id: string;
  contact_type: "whatsapp" | "phone" | "email";
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  message: string | null;
  created_at: string;
  properties: { title: string } | null;
  offices: { name: string } | null;
}

export default function AdminContactRequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const dict = getMessages(locale);
  const mountedRef = useRef(true);

  // Auth guard - protect admin route (runs after hooks, safe for redirects)
  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (profile?.role !== ROLES.SUPER_ADMIN) {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [user, profile, locale, router]);

  // Call hooks before any conditional returns (React Rules of Hooks)
  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*, properties(title), offices(name)")
        .order("created_at", { ascending: false });

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        if (!mountedRef.current) return;
        setRequests(data || []);
      }
    } catch (err) {
      logger.error("Failed to fetch contact requests", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError]);

  useEffect(() => {
    mountedRef.current = true;
    loadRequests();
    return () => { mountedRef.current = false; };
  }, [loadRequests]);

  // Don't render content if not authorized
  if (!user || profile?.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("contact_requests")
        .delete()
        .eq("id", deleteId);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        setRequests((prev) => prev.filter((r) => r.id !== deleteId));
        showToast(dict.common.delete + " ✓", "success");
      }
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

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

  // Get unique offices
  const offices = Array.from(
    new Map(
      requests
        .filter((r) => r.offices)
        .map((r) => [r.office_id, r.offices!.name])
    ).entries()
  );

  const filteredRequests = requests.filter((r) => {
    if (filter !== "all" && r.contact_type !== filter) return false;
    if (officeFilter !== "all" && r.office_id !== officeFilter) return false;
    return true;
  });

  const counts = {
    all: requests.length,
    whatsapp: requests.filter((r) => r.contact_type === "whatsapp").length,
    phone: requests.filter((r) => r.contact_type === "phone").length,
    email: requests.filter((r) => r.contact_type === "email").length,
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{dict.contactRequests.title}</h1>
          <span className="text-sm text-gray-500">
            {filteredRequests.length} {dict.contactRequests.requestsCount}
          </span>
        </div>

        {/* Contact Type Filter */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label={dict.contactRequests.type}>
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

        {/* Office Filter */}
        {offices.length > 0 && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={officeFilter}
                onChange={(e) => setOfficeFilter(e.target.value)}
                aria-label={dict.contactRequests.allOffices}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{dict.contactRequests.allOffices}</option>
              {offices.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {filteredRequests.length > 0 ? (
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
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {request.offices && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {request.offices.name}
                        </span>
                      )}
                      {request.properties && (
                        <span>{dict.contactRequests.property}: {request.properties.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => setDeleteId(request.id)}
                      aria-label={`${dict.common.delete} ${request.visitor_name ?? ""}`}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">{dict.contactRequests.noRequests}</p>
            <p className="text-sm text-gray-400">{dict.contactRequests.noRequestsHint}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={dict.common.delete}
      >
        <p className="text-gray-600 mb-4">{dict.contactRequests.confirmDeleteRequest}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {dict.common.cancel}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? dict.common.loading : dict.common.delete}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

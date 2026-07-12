"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, MessageSquare, ExternalLink, Inbox, Trash2,
  CheckCircle, Circle, Clock, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";

interface ContactRequest {
  id: string;
  property_id: string;
  contact_type: "whatsapp" | "phone" | "email";
  status: "pending" | "read" | "resolved";
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  message: string | null;
  created_at: string;
  properties: { title: string } | null;
}

const PAGE_SIZE = 10;

const STATUS_ICONS: Record<string, typeof Circle> = {
  pending: Clock,
  read: CheckCircle,
  resolved: CheckCircle,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  read: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

export default function ContactRequestsClient({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "bulk">("single");
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const mountedRef = useRef(true);

  const loadRequests = useCallback(async () => {
    try {
      if (!user || !mountedRef.current) {
        router.push(`/${typedLocale}/login`);
        return;
      }

      if (!profile?.officeId) {
        router.push(`/${typedLocale}/explore`);
        return;
      }

      const { data, error: requestsError } = await supabase
        .from("contact_requests")
        .select("id, office_id, property_id, contact_type, status, visitor_name, visitor_email, visitor_phone, message, created_at, properties(title)")
        .eq("office_id", profile.officeId)
        .order("created_at", { ascending: false });

      if (requestsError) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        setRequests((data || []).map((r: ContactRequest) => ({ ...r, status: r.status || "pending" })));
      }
    } catch (err) {
      logger.error("Failed to fetch contact requests", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast, typedLocale, router, dict.common.unexpectedError, user, profile]);

  useEffect(() => {
    mountedRef.current = true;
    if (user && profile) {
      loadRequests();
    }
    return () => { mountedRef.current = false; };
  }, [loadRequests, user, profile]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filter, statusFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "phone": return <Phone className="w-4 h-4 text-navy-600" />;
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

  // Filtering
  const filteredRequests = requests.filter((r) => {
    if (filter !== "all" && r.contact_type !== filter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    all: requests.length,
    whatsapp: requests.filter((r) => r.contact_type === "whatsapp").length,
    phone: requests.filter((r) => r.contact_type === "phone").length,
    email: requests.filter((r) => r.contact_type === "email").length,
  };

  const statusCounts = {
    pending: requests.filter((r) => r.status === "pending").length,
    read: requests.filter((r) => r.status === "read").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  };

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRequests.map((r) => r.id)));
    }
  };

  // Single status update
  const handleStatusUpdate = useCallback(async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contact_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        return;
      }

      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus as ContactRequest["status"] } : r));
      showToast(dict.contactRequests.statusUpdated, "success");
    } catch {
      showToast(dict.common.unexpectedError, "error");
    }
  }, [supabase, showToast, dict]);

  // Bulk status update
  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const { error } = await supabase
        .from("contact_requests")
        .update({ status: newStatus })
        .in("id", ids);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        return;
      }

      setRequests((prev) => prev.map((r) => ids.includes(r.id) ? { ...r, status: newStatus as ContactRequest["status"] } : r));
      setSelectedIds(new Set());
      showToast(`${ids.length} ${dict.contactRequests.statusUpdated}`, "success");
    } catch {
      showToast(dict.common.unexpectedError, "error");
    }
  }, [selectedIds, supabase, showToast, dict]);

  // Single delete
  const handleSingleDelete = useCallback(async () => {
    if (!singleDeleteId) return;

    try {
      const { error } = await supabase
        .from("contact_requests")
        .delete()
        .eq("id", singleDeleteId);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== singleDeleteId));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(singleDeleteId); return next; });
      showToast(dict.contactRequests.deleted, "success");
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setShowDeleteModal(false);
      setSingleDeleteId(null);
    }
  }, [singleDeleteId, supabase, showToast, dict]);

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const { error } = await supabase
        .from("contact_requests")
        .delete()
        .in("id", ids);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        return;
      }

      setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
      setSelectedIds(new Set());
      showToast(`${ids.length} ${dict.contactRequests.deleted}`, "success");
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setShowDeleteModal(false);
    }
  }, [selectedIds, supabase, showToast, dict]);

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.contactRequests.title}
            action={
              <div className="flex items-center gap-3">
                {profile?.officeId && (
                  <button
                    onClick={() => window.open(`/api/export?type=contacts&officeId=${profile.officeId}`, "_blank")}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                )}
                <span className="text-sm text-gray-500">{filteredRequests.length} {dict.contactRequests.requestsCount}</span>
              </div>
            }
          />

          {/* Type Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "whatsapp", "phone", "email"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                aria-pressed={filter === type}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                  filter === type
                    ? "bg-navy-100 text-navy-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type !== "all" && getTypeIcon(type)}
                {type === "all" ? dict.common.all : getTypeLabel(type)}
                <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs">{counts[type]}</span>
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{dict.common.status}:</span>
            {(["all", "pending", "read", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-navy-100 text-navy-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s === "all" ? dict.common.all : dict.contactRequests[s] || s}
                {s !== "all" && <span className="ml-1 text-gray-400">{statusCounts[s]}</span>}
              </button>
            ))}
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-navy-700">
                {selectedIds.size} {dict.contactRequests.selected}
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => { if (e.target.value) handleBulkStatusChange(e.target.value); e.target.value = ""; }}
                  className="border border-navy-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>{dict.contactRequests.updateStatus}</option>
                  <option value="pending">{dict.contactRequests.pending}</option>
                  <option value="read">{dict.contactRequests.read}</option>
                  <option value="resolved">{dict.contactRequests.resolved}</option>
                </select>
                <button
                  onClick={() => { setDeleteTarget("bulk"); setShowDeleteModal(true); }}
                  className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {dict.common.delete}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  {dict.common.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <SkeletonTable rows={5} />
          ) : filteredRequests.length > 0 ? (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  aria-label={selectedIds.size === paginatedRequests.length ? "Deselect all" : "Select all"}
                >
                  {selectedIds.size === paginatedRequests.length
                    ? <CheckCircle className="w-4 h-4 text-navy-600" />
                    : <Circle className="w-4 h-4" />
                  }
                  {selectedIds.size === paginatedRequests.length ? dict.common.all : dict.common.all}
                </button>
              </div>

              {/* Request List */}
              <div className="space-y-3" role="list" aria-live="polite">
                {paginatedRequests.map((request) => {
                  const StatusIcon = STATUS_ICONS[request.status] || Circle;
                  const isSelected = selectedIds.has(request.id);
                  return (
                    <div
                      key={request.id}
                      className={`bg-white rounded-xl border p-4 transition-colors ${
                        isSelected ? "border-navy-300 bg-navy-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(request.id)}
                          className="mt-1 shrink-0"
                          aria-label={request.visitor_name || request.id}
                        >
                          {isSelected
                            ? <CheckCircle className="w-5 h-5 text-navy-600" />
                            : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                          }
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {getTypeIcon(request.contact_type)}
                            <Badge className={STATUS_COLORS[request.status]}>{dict.contactRequests[request.status] || request.status}</Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(request.created_at).toLocaleDateString(typedLocale === "ar" ? "ar-EG" : "en-US")}
                            </span>
                          </div>
                          {request.visitor_name && (
                            <p className="text-sm font-medium text-gray-900">{request.visitor_name}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                            {request.visitor_phone && <span>{request.visitor_phone}</span>}
                            {request.visitor_email && <span>{request.visitor_email}</span>}
                          </div>
                          {request.message && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.message}</p>
                          )}
                          {request.properties && (
                            <p className="text-xs text-gray-400 mt-1">{dict.contactRequests.property}: {request.properties.title}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {request.visitor_phone && (
                            <a
                              href={request.contact_type === "whatsapp" ? `https://wa.me/${request.visitor_phone}` : `tel:${request.visitor_phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-navy-600 hover:text-navy-800 transition-colors p-1"
                              aria-label={dict.contactRequests.view}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <select
                            value={request.status}
                            onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                            aria-label={`${dict.contactRequests.updateStatus} for ${request.visitor_name || ""}`}
                          >
                            <option value="pending">{dict.contactRequests.pending}</option>
                            <option value="read">{dict.contactRequests.read}</option>
                            <option value="resolved">{dict.contactRequests.resolved}</option>
                          </select>
                          <button
                            onClick={() => { setDeleteTarget("single"); setSingleDeleteId(request.id); setShowDeleteModal(true); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label={dict.common.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm" role="status">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500 mb-2">{dict.contactRequests.noRequests}</p>
              <p className="text-sm text-gray-500">{dict.contactRequests.noRequestsHint}</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{dict.common.confirm}</h3>
            <p className="text-gray-600 mb-6">
              {deleteTarget === "bulk"
                ? `${dict.contactRequests.confirmBulkDelete} ${selectedIds.size}?`
                : dict.contactRequests.confirmDelete}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {dict.common.cancel}
              </button>
              <button
                onClick={deleteTarget === "bulk" ? handleBulkDelete : handleSingleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {dict.common.delete}
              </button>
            </div>
          </div>
        </Modal>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

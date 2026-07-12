"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Home, CheckSquare, Square, Trash, Download } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PropertyCard from "@/components/properties/PropertyCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PropertyCardSkeletonGrid } from "@/components/properties/PropertyCardSkeleton";
import { ROLES, PROPERTY_STATUSES, type UserRole, type PropertyStatus } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import type { Locale } from "@/i18n/config";

interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  zone_id: string;
  property_type_id: string;
  created_at: string;
  property_types: { name_ar: string } | null;
  zones: { name_ar: string } | null;
  primaryImage?: string | null;
}

const PAGE_SIZE = 9;

interface Props {
  locale: string;
  initialProperties: Property[];
  initialCount: number;
  initialOfficeName: string;
  initialStats: { available: number; sold: number; rented: number };
  userRole: string;
  userId: string;
  officeId: string;
}

export default function PropertiesDashboardClient({
  locale,
  initialProperties,
  initialCount,
  initialOfficeName,
  initialStats,
  userRole: initialUserRole,
  userId,
  officeId,
}: Props) {
  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);
  const { user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || (initialUserRole as UserRole);
  const router = useRouter();
  const { showToast } = useToast();
  const { supabase } = useAuthUser();

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [officeName] = useState(initialOfficeName);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"status" | "delete" | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [initialLoaded, setInitialLoaded] = useState(true);

  const mountedRef = useRef(true);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadStats = useCallback(async () => {
    if (!officeId || !supabase || !mountedRef.current) return;
    const [avail, sold, rented] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", officeId).eq("status", "available"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", officeId).eq("status", "sold"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", officeId).eq("status", "rented"),
    ]);
    setStats({ available: avail.count || 0, sold: sold.count || 0, rented: rented.count || 0 });
  }, [supabase, officeId]);

  const loadProperties = useCallback(async () => {
    if (!supabase || !mountedRef.current) return;
    setLoading(true);

    try {
      let query = supabase
        .from("properties")
        .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, is_active, office_id, created_at, property_types(name_ar), zones(name_ar)", { count: "exact" })
        .eq("office_id", officeId)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [propertiesResult] = await Promise.all([
        query.range(from, to),
      ]);

      const { data, count } = propertiesResult;
      setTotalCount(count || 0);

      const propertyIds = (data || []).map((p: Property) => p.id);
      const { data: images } = propertyIds.length > 0
        ? await supabase.from("property_images").select("property_id, url").in("property_id", propertyIds).eq("is_primary", true)
        : { data: null };

      const imageMap = new Map(images?.map((img: { property_id: string; url: string }) => [img.property_id, img.url]) || []);
      const withImages = (data || []).map((p: Property) => ({
        ...p,
        primaryImage: imageMap.get(p.id) || null,
      }));

      setProperties(withImages);
    } catch (err) {
      logger.error("Failed to load properties", { error: err instanceof Error ? err.message : "Unknown" });
    } finally {
      setLoading(false);
    }
  }, [supabase, officeId, statusFilter, page]);

  useEffect(() => {
    mountedRef.current = true;
    if (initialLoaded) {
      setInitialLoaded(false);
      return;
    }
    loadStats();
    loadProperties();
    return () => { mountedRef.current = false; };
  }, [page, statusFilter, loadStats, loadProperties, initialLoaded]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: bulkStatus, updated_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds));

      if (!error) {
        showToast(dict.common.success || "Status updated", "success");
        setSelectedIds(new Set());
        setBulkAction(null);
        loadProperties();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", Array.from(selectedIds));

      if (!error) {
        showToast(dict.common.delete || "Deleted", "success");
        setSelectedIds(new Set());
        setBulkAction(null);
        loadProperties();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (propertyId: string, newStatus: Property["status"]) => {
    if (!PROPERTY_STATUSES.includes(newStatus as PropertyStatus)) {
      showToast(dict.common.error, "error");
      return;
    }
    setUpdatingStatus(propertyId);

    // Capture old status before update
    const oldProperty = properties.find((p) => p.id === propertyId);
    const oldStatus = oldProperty?.status;

    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", propertyId);

    if (!error) {
      setProperties((prev) =>
        prev.map((p: Property) => (p.id === propertyId ? { ...p, status: newStatus } : p))
      );
      showToast(dict.common.save, "success");
      loadStats();
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({
          action: "property.updated",
          entity_type: "property",
          entity_id: propertyId,
          metadata: { field: "status", new_value: newStatus },
        }),
      }).catch(() => {});

      // Send status change notifications (fire-and-forget)
      if (oldStatus && oldStatus !== newStatus) {
        fetch("/api/notify/property-change", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({
            property_id: propertyId,
            change_type: "status",
            old_value: oldStatus,
            new_value: newStatus,
          }),
        }).catch(() => {});
      }
    } else {
      showToast(dict.common.unexpectedError, "error");
    }
    setUpdatingStatus(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("properties").delete().eq("id", deleteId);
      if (!error) {
        showToast(dict.common.delete, "success");
        setProperties((prev) => prev.filter((p) => p.id !== deleteId));
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({ action: "property.deleted", entity_type: "property", entity_id: deleteId }),
        }).catch(() => {});
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch {
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  if (loading && properties.length === 0) {
    return (
      <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">{dict.office.myProperties}</h1>
          <PropertyCardSkeletonGrid count={6} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{dict.office.myProperties}</h1>
          {(userRole === ROLES.OFFICE_ADMIN || userRole === ROLES.OFFICE_AGENT) && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`/api/export?type=properties&officeId=${officeId}`, "_blank");
                }}
              >
                <Download className="w-4 h-4 ms-2" />
                CSV
              </Button>
              <Link href={`/${typedLocale}/dashboard/properties/new`}>
                <Button>
                  <Plus className="w-4 h-4 ms-2" />
                  {dict.office.addProperty}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: dict.property.status.available, value: stats.available, color: "green" },
            { label: dict.property.status.sold, value: stats.sold, color: "red" },
            { label: dict.property.status.rented, value: stats.rented, color: "blue" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default">
              <p className={`text-2xl font-bold ${s.color === "green" ? "text-green-600" : s.color === "red" ? "text-red-600" : "text-navy-600"}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: dict.common.all },
            { key: "available", label: dict.property.status.available },
            { key: "sold", label: dict.property.status.sold },
            { key: "rented", label: dict.property.status.rented },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                statusFilter === f.key
                  ? "bg-navy-100 text-navy-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-200">
            <span className="text-sm font-medium text-navy-700">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
              >
                <option value="">{dict.office.propertyStatus || "Change Status"}</option>
                <option value="available">{dict.property.status.available}</option>
                <option value="sold">{dict.property.status.sold}</option>
                <option value="rented">{dict.property.status.rented}</option>
                <option value="reserved">{dict.property.status.reserved}</option>
              </select>
              <Button size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatus || bulkLoading} isLoading={bulkLoading}>
                Apply
              </Button>
              <Button size="sm" variant="danger" onClick={() => setBulkAction("delete")}>
                <Trash className="w-4 h-4 ms-1" />
                {dict.common.delete}
              </Button>
            </div>
            <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700 ms-auto">
              {dict.common.cancel}
            </button>
          </div>
        )}

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <div key={property.id} className="relative group">
                {(userRole === ROLES.OFFICE_ADMIN || userRole === ROLES.OFFICE_AGENT) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(property.id); }}
                    className="absolute top-2 end-2 z-10 p-1 rounded bg-white/80 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                    aria-label={selectedIds.has(property.id) ? "Deselect" : "Select"}
                  >
                    {selectedIds.has(property.id) ? (
                      <CheckSquare className="w-4 h-4 text-navy-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
                <PropertyCard
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  area={property.area}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  zone={property.zones?.name_ar}
                  imageUrl={property.primaryImage || undefined}
                  status={property.status}
                  officeName={officeName}
                  locale={typedLocale}
                  type={property.property_types?.name_ar}
                  userId={userId}
                />
                {(userRole === ROLES.OFFICE_ADMIN || userRole === ROLES.OFFICE_AGENT) && (
                  <div className="absolute top-2 start-2 flex items-center gap-1">
                    <select
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.id, e.target.value as Property["status"])}
                      disabled={updatingStatus === property.id}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={dict.common.changePropertyStatus}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-navy-500 cursor-pointer ${
                        property.status === "available"
                          ? "bg-green-100 text-green-700"
                          : property.status === "sold"
                          ? "bg-red-100 text-red-700"
                          : property.status === "reserved"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-navy-100 text-navy-700"
                      }`}
                    >
                      <option value="available">{dict.property.status.available}</option>
                      <option value="sold">{dict.property.status.sold}</option>
                      <option value="rented">{dict.property.status.rented}</option>
                      <option value="reserved">{dict.property.status.reserved}</option>
                      <option value="pending_review">{dict.property.status.pending_review}</option>
                    </select>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <Link
                        href={`/${typedLocale}/dashboard/properties/${property.id}/edit`}
                        className="p-2 bg-white rounded min-w-[44px] min-h-[44px] flex items-center justify-center-lg shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1"
                        aria-label={dict.office.editProperty}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(property.id)}
                        className="p-2 bg-white rounded min-w-[44px] min-h-[44px] flex items-center justify-center-lg shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1"
                        aria-label={dict.common.delete}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-navy-50 to-navy-100 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-navy-200/60">
              <Home className="w-10 h-10 text-navy-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1.5">{dict.office.noPropertiesYet}</p>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">{dict.office.startAdding}</p>
            {(userRole === ROLES.OFFICE_ADMIN || userRole === ROLES.OFFICE_AGENT) && (
              <Link href={`/${typedLocale}/dashboard/properties/new`} className="mt-2 inline-block">
                <Button>{dict.office.addProperty}</Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dict.common.previous}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p: number) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-label={`${p}`}
                aria-current={page === p ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                  page === p
                    ? "bg-navy-600 text-white"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dict.common.next}
            </button>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        <Modal isOpen={bulkAction === "delete"} onClose={() => setBulkAction(null)} title={dict.common.confirm} size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">{dict.office.confirmDeleteProperty} ({selectedIds.size} properties)</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBulkAction(null)}>{dict.common.cancel}</Button>
              <Button variant="danger" onClick={handleBulkDelete} isLoading={bulkLoading}>{dict.common.delete}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={dict.common.confirm} size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">{dict.office.confirmDeleteProperty}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{dict.common.cancel}</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>{dict.common.delete}</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

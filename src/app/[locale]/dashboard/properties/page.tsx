"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Home } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PropertyCard from "@/components/properties/PropertyCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ROLES, PROPERTY_STATUSES, type UserRole, type PropertyStatus } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";

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

export default function PropertiesPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [properties, setProperties] = useState<Property[]>([]);
  const [officeName, setOfficeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ available: 0, sold: 0, rented: 0 });
  const router = useRouter();
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const mountedRef = useRef(true);

  const loadStats = useCallback(async () => {
    if (!profile?.officeId || !supabase || !mountedRef.current) return;
    const [avail, sold, rented] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.officeId).eq("status", "available"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.officeId).eq("status", "sold"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("office_id", profile.officeId).eq("status", "rented"),
    ]);
    setStats({ available: avail.count || 0, sold: sold.count || 0, rented: rented.count || 0 });
  }, [supabase, profile]);

  const loadProperties = useCallback(async () => {
    if (!user || !mountedRef.current) {
      router.push(`/${locale}/login`);
      return;
    }

    if (!profile?.officeId) {
      router.push(`/${locale}/explore`);
      return;
    }

    try {
      let query = supabase
        .from("properties")
        .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, is_active, office_id, created_at, property_types(name_ar), zones(name_ar)", { count: "exact" })
        .eq("office_id", profile.officeId)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [propertiesResult, officeResult] = await Promise.all([
        query.range(from, to),
        supabase.from("offices").select("name").eq("id", profile.officeId).maybeSingle(),
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
      setOfficeName(officeResult.data?.name || "");
    } catch (err) {
      logger.error("Failed to load properties", { error: err instanceof Error ? err.message : "Unknown" });
    } finally {
      setLoading(false);
    }
  }, [supabase, locale, router, statusFilter, page, user, profile]);

  useEffect(() => {
    mountedRef.current = true;
    if (locale && user && profile) {
      loadStats();
      loadProperties();
    }
    return () => { mountedRef.current = false; };
  }, [locale, page, statusFilter, loadStats, loadProperties, user, profile]);

  const dict = getMessages(locale);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
      // Log activity (fire-and-forget)
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "property.updated",
          entity_type: "property",
          entity_id: propertyId,
          metadata: { field: "status", new_value: newStatus },
        }),
      }).catch(() => {});
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
        // Log activity (fire-and-forget)
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "property.deleted",
            entity_type: "property",
            entity_id: deleteId,
          }),
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

  if (loading) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={userRole}>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{dict.office.myProperties}</h1>
          {userRole === ROLES.OFFICE_ADMIN && (
            <Link href={`/${locale}/dashboard/properties/new`}>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                {dict.office.addProperty}
              </Button>
            </Link>
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
              <p className={`text-2xl font-bold ${s.color === "green" ? "text-green-600" : s.color === "red" ? "text-red-600" : "text-blue-600"}`}>{s.value}</p>
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                statusFilter === f.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <div key={property.id} className="relative group">
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
                  locale={locale}
                  type={property.property_types?.name_ar}
                  userId={user?.id || null}
                />
          {userRole === ROLES.OFFICE_ADMIN && (
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {/* Status dropdown */}
<select
                       value={property.status}
                       onChange={(e) => handleStatusChange(property.id, e.target.value as Property["status"])}
                       disabled={updatingStatus === property.id}
                       onClick={(e) => e.stopPropagation()}
                        aria-label={dict.common.changePropertyStatus}
                       className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                         property.status === "available"
                           ? "bg-green-100 text-green-700"
                           : property.status === "sold"
                           ? "bg-red-100 text-red-700"
                           : property.status === "reserved"
                           ? "bg-amber-100 text-amber-700"
                           : "bg-blue-100 text-blue-700"
                       }`}
                     >
                       <option value="available">{dict.property.status.available}</option>
                       <option value="sold">{dict.property.status.sold}</option>
                       <option value="rented">{dict.property.status.rented}</option>
                       <option value="reserved">{dict.property.status.reserved}</option>
                       <option value="pending_review">{dict.property.status.pending_review}</option>
                     </select>
                    {/* Edit/Delete buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/${locale}/dashboard/properties/${property.id}/edit`}
                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                        aria-label={dict.office.editProperty}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(property.id)}
                        className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-blue-200/60">
              <Home className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1.5">
              {dict.office.noPropertiesYet}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
              {dict.office.startAdding}
            </p>
          {userRole === ROLES.OFFICE_ADMIN && (
              <Link href={`/${locale}/dashboard/properties/new`} className="mt-2 inline-block">
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
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dict.common.previous}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p: number) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-label={`${p}`}
                aria-current={page === p ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  page === p
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dict.common.next}
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={dict.common.confirm}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              {dict.office.confirmDeleteProperty}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                {dict.common.cancel}
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
                {dict.common.delete}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

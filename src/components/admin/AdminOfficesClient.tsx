"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2, Eye, EyeOff, Building, Edit } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { usePageLocale } from "@/hooks/usePageLocale";
import { officeSchema } from "@/lib/validation";
import { ROLES } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { getValidationMessage } from "@/lib/utils/validationMessages";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

interface Office {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  usersCount?: number;
  propertiesCount?: number;
}

export default function AdminOfficesClient({
  params,
}: {
  params: { locale: string };
}) {
const locale = params.locale as Locale;
   const router = useRouter();
   const { user: authUser, profile, supabase } = useAuthUser();
   const [offices, setOffices] = useState<Office[]>([]);
   const [showModal, setShowModal] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);
   const [editModal, setEditModal] = useState<{ open: boolean; office: Office | null }>({ open: false, office: null });
   const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
   const [editErrors, setEditErrors] = useState<Record<string, string>>({});
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [togglingId, setTogglingId] = useState<string | null>(null);
   const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    const { showToast } = useToast();
    const dict = getMessages(locale as Locale);
    const mountedRef = useRef(true);

// Auth guard - protect admin route (runs after hooks, safe for redirects)
    useEffect(() => {
      if (!authUser) {
        router.push(`/${locale}/login`);
        return;
      }
      if (profile?.role !== ROLES.SUPER_ADMIN) {
        router.push(`/${locale}/dashboard`);
        return;
      }
    }, [authUser, profile, locale, router]);

    const loadOffices = useCallback(async () => {
     try {
        const { data, error } = await supabase
          .from("offices")
          .select("id, name, slug, email, phone, address, logo_url, is_active, created_at, updated_at")
          .order("created_at", { ascending: false });

        if (error) {
          showToast(dict.common.unexpectedError, "error");
          setLoading(false);
          return;
        }

       // Fetch all counts in parallel (2 queries total, not 2N)
       const officeIds = (data || []).map((o: Office) => o.id);
       const [usersCountsRes, propsCountsRes] = await Promise.all([
         supabase.from("users").select("office_id").in("office_id", officeIds),
         supabase.from("properties").select("office_id").in("office_id", officeIds),
       ]);

       // Aggregate counts in JavaScript
       const usersCounts: Record<string, number> = {};
       const propsCounts: Record<string, number> = {};

       (usersCountsRes.data || []).forEach((row: { office_id: string }) => {
         usersCounts[row.office_id] = (usersCounts[row.office_id] || 0) + 1;
       });

       (propsCountsRes.data || []).forEach((row: { office_id: string }) => {
         propsCounts[row.office_id] = (propsCounts[row.office_id] || 0) + 1;
       });

       const officesWithCounts = (data || []).map((office: Office) => ({
         ...office,
         usersCount: usersCounts[office.id] || 0,
         propertiesCount: propsCounts[office.id] || 0,
       }));

        setOffices(officesWithCounts);
      } catch (err) {
        logger.error("Failed to fetch offices", { error: err instanceof Error ? err.message : String(err) });
        showToast(dict.common.unexpectedError, "error");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }, [supabase, showToast, dict.common.unexpectedError]);

    useEffect(() => {
      mountedRef.current = true;
      loadOffices();
      return () => { mountedRef.current = false; };
    }, [loadOffices]);

   // Don't render content if not authorized
   if (!authUser || profile?.role !== ROLES.SUPER_ADMIN) {
     return null;
   }

   if (authUser && profile?.role === ROLES.SUPER_ADMIN && loading) {
     return (
       <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
         <div className="flex items-center justify-center py-20">
           <LuxuryLoader />
         </div>
       </DashboardLayout>
     );
   }

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = officeSchema.safeParse({
      name: formData.name,
      slug: formData.slug,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    });

    const newErrors: Record<string, string> = {};
    if (!result.success) {
      const validationDict = dict.validation as Record<string, string>;
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = getValidationMessage(issue, validationDict);
      });
    }

    if (!formData.adminName) newErrors.adminName = dict.admin.adminNameRequired;
    if (!formData.adminEmail) newErrors.adminEmail = dict.admin.adminEmailRequired;
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      newErrors.adminPassword = dict.admin.adminPasswordMin;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const { data: office, error: officeError } = await supabase
        .from("offices")
        .insert({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || `office-${Date.now()}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        })
        .select()
        .single();

      if (officeError) {
        showToast(dict.common.unexpectedError, "error");
        setSaving(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
        await supabase.from("offices").delete().eq("id", office.id);
        setSaving(false);
        return;
      }

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
          fullName: formData.adminName,
          officeId: office.id,
          role: ROLES.OFFICE_ADMIN,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        // Rollback: delete the orphaned office since admin user creation failed
        await supabase.from("offices").delete().eq("id", office.id);
        showToast(dict.admin.offices?.agentCreationFailed || result.error || dict.common.unexpectedError, "error");
      } else {
        showToast(dict.admin.officeCreated, "success");
      }

      setShowModal(false);
      setFormData({ name: "", slug: "", email: "", phone: "", address: "", adminName: "", adminEmail: "", adminPassword: "" });
      loadOffices();
    } catch (err) {
      logger.error("Failed to create office", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteOffice = async () => {
    if (!deleteId) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("offices").delete().eq("id", deleteId);
      if (!error) {
        showToast(dict.common.delete, "success");
        loadOffices();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to delete office", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleEditOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.office) return;

    const result = officeSchema.safeParse({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
    });

    const newErrors: Record<string, string> = {};
    if (!result.success) {
      const validationDict = dict.validation as Record<string, string>;
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = getValidationMessage(issue, validationDict);
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    setEditErrors({});
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/offices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          id: editModal.office.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || dict.common.unexpectedError, "error");
        return;
      }

      showToast(dict.admin.officeUpdated, "success");
      setEditModal({ open: false, office: null });
      loadOffices();
    } catch (err) {
      logger.error("Failed to update office", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleOfficeStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const { error } = await supabase.from("offices").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      loadOffices();
    } catch (err) {
      logger.error("Failed to update office status", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.nav.offices}
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 ms-2" />
                {dict.admin.addOffice}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <>
                <PaginatedTable
                  data={offices}
                  searchKey="name"
                  searchPlaceholder={dict.admin.searchOffices}
                  emptyMessage={dict.common.noData}
                  emptyIcon={<Building className="w-12 h-12 text-navy-300" />}
                  emptyHint={dict.admin.noOfficesHint}
                  columns={[
                    {
                      key: "name",
                      header: dict.admin.columnOffice,
                      render: (office) => (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-navy-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{office.name}</p>
                            <p className="text-sm text-gray-500">{office.slug}</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "email",
                      header: dict.admin.columnContact,
                      render: (office) => (
                        <>
                          <p className="text-sm text-gray-900">{office.email}</p>
                          <p className="text-sm text-gray-500">{office.phone}</p>
                        </>
                      ),
                    },
                    {
                      key: "usersCount",
                      header: dict.admin.columnUsers,
                      className: "text-center",
                      render: (office) => (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
                          {office.usersCount}
                        </span>
                      ),
                    },
                    {
                      key: "propertiesCount",
                      header: dict.admin.columnProperties,
                      className: "text-center",
                      render: (office) => (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {office.propertiesCount}
                        </span>
                      ),
                    },
                    {
                      key: "is_active",
                      header: dict.admin.columnStatus,
                      render: (office) => (
                        <Badge variant={office.is_active ? "success" : "danger"}>
                          {office.is_active ? dict.common.active : dict.common.inactive}
                        </Badge>
                      ),
                    },
                    {
                      key: "created_at",
                      header: dict.admin.columnDate,
                      render: (office) => (
                        <span className="text-sm text-gray-500">
                          {new Date(office.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                        </span>
                      ),
                    },
                    {
                      key: "actions",
                      header: dict.admin.columnActions,
                      render: (office) => (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditForm({
                                name: office.name,
                                email: office.email || "",
                                phone: office.phone || "",
                                address: office.address || "",
                              });
                              setEditModal({ open: true, office });
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title={dict.admin.editOffice}
                            aria-label={dict.admin.editOffice}
                          >
                            <Edit className="w-4 h-4 text-navy-600" />
                          </button>
                          <button
                            onClick={() => toggleOfficeStatus(office.id, office.is_active)}
                            disabled={togglingId === office.id}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title={office.is_active ? dict.admin.deactivate : dict.admin.activate}
                            aria-label={office.is_active ? dict.admin.deactivate : dict.admin.activate}
                          >
                            {office.is_active ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                          <button
                            onClick={() => confirmDelete(office.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title={dict.admin.deleteOffice}
                            aria-label={dict.admin.deleteOffice}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </Card>

          {/* Create Office Modal */}
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={dict.admin.addOffice} size="lg">
            <form onSubmit={handleCreateOffice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input label={dict.admin.officeName} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  {errors.name && <p role="alert" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input label={dict.admin.officeSlug} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={dict.admin.officeSlug} />
                </div>
                <div>
                  <Input label={dict.common.email} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  {errors.email && <p role="alert" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Input label={dict.common.phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  {errors.phone && <p role="alert" className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <Input label={dict.common.address} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3">{dict.admin.adminData}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input label={dict.admin.adminName} value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} />
                    {errors.adminName && <p role="alert" className="text-red-500 text-xs mt-1">{errors.adminName}</p>}
                  </div>
                  <div>
                    <Input label={dict.admin.adminEmail} type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} />
                    {errors.adminEmail && <p role="alert" className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
                  </div>
                  <div>
                    <Input label={dict.admin.adminPassword} type="password" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} />
                    {errors.adminPassword && <p role="alert" className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{dict.common.cancel}</Button>
                <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
              </div>
            </form>
          </Modal>

          {/* Edit Office Modal */}
          <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, office: null })} title={dict.admin.editOffice} size="lg">
            <form onSubmit={handleEditOffice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input label={dict.admin.officeName} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  {editErrors.name && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                </div>
                <div>
                  <Input label={dict.common.email} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  {editErrors.email && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
                </div>
                <div>
                  <Input label={dict.common.phone} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  {editErrors.phone && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.phone}</p>}
                </div>
                <div>
                  <Input label={dict.common.address} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditModal({ open: false, office: null })}>{dict.common.cancel}</Button>
                <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={dict.common.confirm} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.confirmDeleteOffice}</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{dict.common.cancel}</Button>
                <Button variant="danger" onClick={handleDeleteOffice} isLoading={saving}>{dict.common.delete}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

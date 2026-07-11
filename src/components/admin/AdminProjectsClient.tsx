"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { ROLES, PROJECT_STATUSES } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

interface Project {
  id: string;
  developer_id: string;
  title: string;
  slug: string;
  description: string | null;
  zone_id: string | null;
  status: string;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  delivery_date: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface DeveloperOption {
  id: string;
  name: string;
}

interface ZoneOption {
  id: string;
  name_ar: string;
  name_en: string | null;
}

export default function AdminProjectsClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const router = useRouter();
  const { user: authUser, profile, supabase } = useAuthUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<DeveloperOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    developer_id: "",
    description: "",
    zone_id: "",
    status: "upcoming",
    min_price: "",
    max_price: "",
    min_area: "",
    max_area: "",
    delivery_date: "",
    cover_image_url: "",
  });
  const { showToast } = useToast();
  const dict = getMessages(locale as Locale);
  const mountedRef = useRef(true);

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

  const loadData = useCallback(async () => {
    try {
      const [projectsRes, developersRes, zonesRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("developers").select("id, name").eq("is_active", true).order("name"),
        supabase.from("zones").select("id, name_ar, name_en").order("name_ar"),
      ]);

      if (projectsRes.error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        setProjects(projectsRes.data || []);
      }
      setDevelopers(developersRes.data || []);
      setZones(zonesRes.data || []);
    } catch (err) {
      logger.error("Failed to load data", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, [loadData]);

  if (!authUser || profile?.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
        <div className="flex items-center justify-center py-20">
          <LuxuryLoader />
        </div>
      </DashboardLayout>
    );
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      upcoming: dict.admin.statusUpcoming,
      under_construction: dict.admin.statusUnderConstruction,
      delivered: dict.admin.statusDelivered,
    };
    return map[status] || status;
  };

  const statusVariant = (status: string): "info" | "warning" | "success" => {
    const map: Record<string, "info" | "warning" | "success"> = {
      upcoming: "info",
      under_construction: "warning",
      delivered: "success",
    };
    return map[status] || "info";
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.length < 2) newErrors.title = dict.admin.projectTitle;
    if (!formData.developer_id) newErrors.developer_id = dict.admin.projectDeveloper;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || `project-${Date.now()}`;

      const { error } = await supabase.from("projects").insert({
        title: formData.title,
        slug,
        developer_id: formData.developer_id,
        description: formData.description || null,
        zone_id: formData.zone_id || null,
        status: formData.status,
        min_price: formData.min_price ? Number(formData.min_price) : null,
        max_price: formData.max_price ? Number(formData.max_price) : null,
        min_area: formData.min_area ? Number(formData.min_area) : null,
        max_area: formData.max_area ? Number(formData.max_area) : null,
        delivery_date: formData.delivery_date || null,
        cover_image_url: formData.cover_image_url || null,
      });

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        showToast(dict.admin.projectCreated, "success");
        setShowModal(false);
        resetForm();
        loadData();
      }
    } catch (err) {
      logger.error("Failed to create project", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "", slug: "", developer_id: "", description: "", zone_id: "",
      status: "upcoming", min_price: "", max_price: "", min_area: "",
      max_area: "", delivery_date: "", cover_image_url: "",
    });
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteProject = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", deleteId);
      if (!error) {
        showToast(dict.common.delete, "success");
        loadData();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to delete project", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const toggleProjectStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const { error } = await supabase.from("projects").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err) {
      logger.error("Failed to update project status", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const getDeveloperName = (devId: string) => {
    return developers.find((d) => d.id === devId)?.name || "-";
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.admin.manageProjects}
            action={
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="w-4 h-4 ms-2" />
                {dict.admin.addProject}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={projects}
                searchKey="title"
                searchPlaceholder={dict.admin.searchProjects}
                emptyMessage={dict.common.noData}
                emptyIcon={<Briefcase className="w-12 h-12 text-navy-300" />}
                emptyHint={dict.admin.noProjectsHint}
                columns={[
                  {
                    key: "title",
                    header: dict.admin.columnProject,
                    render: (proj) => (
                      <div>
                        <p className="font-medium text-gray-900">{proj.title}</p>
                        <p className="text-sm text-gray-500">{getDeveloperName(proj.developer_id)}</p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: dict.admin.projectStatus,
                    render: (proj) => (
                      <Badge variant={statusVariant(proj.status)}>
                        {statusLabel(proj.status)}
                      </Badge>
                    ),
                  },
                  {
                    key: "min_price",
                    header: dict.admin.columnPriceRange,
                    render: (proj) => (
                      <span className="text-sm text-gray-700">
                        {proj.min_price || proj.max_price
                          ? `${formatPrice(proj.min_price)} - ${formatPrice(proj.max_price)}`
                          : "-"}
                      </span>
                    ),
                  },
                  {
                    key: "delivery_date",
                    header: dict.admin.columnDelivery,
                    render: (proj) => (
                      <span className="text-sm text-gray-500">
                        {proj.delivery_date
                          ? new Date(proj.delivery_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")
                          : "-"}
                      </span>
                    ),
                  },
                  {
                    key: "is_active",
                    header: dict.admin.columnStatus,
                    render: (proj) => (
                      <Badge variant={proj.is_active ? "success" : "danger"}>
                        {proj.is_active ? dict.common.active : dict.common.inactive}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: dict.admin.columnActions,
                    render: (proj) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProjectStatus(proj.id, proj.is_active)}
                          disabled={togglingId === proj.id}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={proj.is_active ? dict.admin.deactivate : dict.admin.activate}
                        >
                          {proj.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-500" />}
                        </button>
                        <button
                          onClick={() => confirmDelete(proj.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={dict.common.delete}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={dict.admin.addProject} size="lg">
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input label={dict.admin.projectTitle} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  {errors.title && <p role="alert" className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                  <Input label={dict.admin.projectSlug} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.projectDeveloper}</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    value={formData.developer_id}
                    onChange={(e) => setFormData({ ...formData, developer_id: e.target.value })}
                    required
                  >
                    <option value="">-- {dict.admin.projectDeveloper} --</option>
                    {developers.map((dev) => (
                      <option key={dev.id} value={dev.id}>{dev.name}</option>
                    ))}
                  </select>
                  {errors.developer_id && <p role="alert" className="text-red-500 text-xs mt-1">{errors.developer_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.projectStatus}</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.projectZone}</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                  >
                    <option value="">-- {dict.admin.projectZone} --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{locale === "ar" ? z.name_ar : (z.name_en || z.name_ar)}</option>
                    ))}
                  </select>
                </div>
                <Input label={dict.admin.projectDelivery} type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
                <Input label={dict.admin.projectMinPrice} type="number" value={formData.min_price} onChange={(e) => setFormData({ ...formData, min_price: e.target.value })} />
                <Input label={dict.admin.projectMaxPrice} type="number" value={formData.max_price} onChange={(e) => setFormData({ ...formData, max_price: e.target.value })} />
                <Input label={dict.admin.projectMinArea} type="number" value={formData.min_area} onChange={(e) => setFormData({ ...formData, min_area: e.target.value })} />
                <Input label={dict.admin.projectMaxArea} type="number" value={formData.max_area} onChange={(e) => setFormData({ ...formData, max_area: e.target.value })} />
                <Input label={dict.admin.projectCoverImage} value={formData.cover_image_url} onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.projectDescription}</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{dict.common.cancel}</Button>
                <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
              </div>
            </form>
          </Modal>

          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={dict.common.confirm} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.deleteProject}</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{dict.common.cancel}</Button>
                <Button variant="danger" onClick={handleDeleteProject} isLoading={saving}>{dict.common.delete}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

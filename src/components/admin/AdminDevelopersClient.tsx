"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2, Eye, EyeOff, Globe } from "lucide-react";
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
import { ROLES } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

interface Developer {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  projectsCount?: number;
}

export default function AdminDevelopersClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const router = useRouter();
  const { user: authUser, profile, supabase } = useAuthUser();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    logo_url: "",
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

  const loadDevelopers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        setLoading(false);
        return;
      }

      const developerIds = (data || []).map((d: Developer) => d.id);
      const { data: projectsData } = await supabase
        .from("projects")
        .select("developer_id")
        .in("developer_id", developerIds);

      const projectsCounts: Record<string, number> = {};
      (projectsData || []).forEach((row: { developer_id: string }) => {
        projectsCounts[row.developer_id] = (projectsCounts[row.developer_id] || 0) + 1;
      });

      const developersWithCounts = (data || []).map((dev: Developer) => ({
        ...dev,
        projectsCount: projectsCounts[dev.id] || 0,
      }));

      setDevelopers(developersWithCounts);
    } catch (err) {
      logger.error("Failed to fetch developers", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError]);

  useEffect(() => {
    mountedRef.current = true;
    loadDevelopers();
    return () => { mountedRef.current = false; };
  }, [loadDevelopers]);

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

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2) newErrors.name = dict.admin.developerName;
    if (!formData.slug && !formData.name) newErrors.slug = dict.admin.developerSlug;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || `developer-${Date.now()}`;

      const { error } = await supabase.from("developers").insert({
        name: formData.name,
        slug,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
      });

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        showToast(dict.admin.developerCreated, "success");
        setShowModal(false);
        setFormData({ name: "", slug: "", email: "", phone: "", website: "", description: "", logo_url: "" });
        loadDevelopers();
      }
    } catch (err) {
      logger.error("Failed to create developer", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteDeveloper = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("developers").delete().eq("id", deleteId);
      if (!error) {
        showToast(dict.common.delete, "success");
        loadDevelopers();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to delete developer", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const toggleDeveloperStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const { error } = await supabase.from("developers").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      loadDevelopers();
    } catch (err) {
      logger.error("Failed to update developer status", { error: err instanceof Error ? err.message : String(err) });
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
            title={dict.admin.manageDevelopers}
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 ms-2" />
                {dict.admin.addDeveloper}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={developers}
                searchKey="name"
                searchPlaceholder={dict.admin.searchDevelopers}
                emptyMessage={dict.common.noData}
                emptyIcon={<Building2 className="w-12 h-12 text-navy-300" />}
                emptyHint={dict.admin.noDevelopersHint}
                columns={[
                  {
                    key: "name",
                    header: dict.admin.columnDeveloper,
                    render: (dev) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dev.name}</p>
                          <p className="text-sm text-gray-500">{dev.slug}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "email",
                    header: dict.admin.columnContact,
                    render: (dev) => (
                      <>
                        <p className="text-sm text-gray-900">{dev.email || "-"}</p>
                        <p className="text-sm text-gray-500">{dev.phone || ""}</p>
                      </>
                    ),
                  },
                  {
                    key: "website",
                    header: dict.admin.columnWebsite,
                    render: (dev) => (
                      dev.website ? (
                        <a href={dev.website} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:underline flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="text-sm truncate max-w-[120px]">{dev.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : <span className="text-gray-400">-</span>
                    ),
                  },
                  {
                    key: "projectsCount",
                    header: dict.nav.projects,
                    className: "text-center",
                    render: (dev) => (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {dev.projectsCount}
                      </span>
                    ),
                  },
                  {
                    key: "is_active",
                    header: dict.admin.columnStatus,
                    render: (dev) => (
                      <Badge variant={dev.is_active ? "success" : "danger"}>
                        {dev.is_active ? dict.common.active : dict.common.inactive}
                      </Badge>
                    ),
                  },
                  {
                    key: "created_at",
                    header: dict.admin.columnDate,
                    render: (dev) => (
                      <span className="text-sm text-gray-500">
                        {new Date(dev.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: dict.admin.columnActions,
                    render: (dev) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleDeveloperStatus(dev.id, dev.is_active)}
                          disabled={togglingId === dev.id}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={dev.is_active ? dict.admin.deactivate : dict.admin.activate}
                          aria-label={dev.is_active ? dict.admin.deactivate : dict.admin.activate}
                        >
                          {dev.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-500" />}
                        </button>
                        <button
                          onClick={() => confirmDelete(dev.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={dict.common.delete}
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

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={dict.admin.addDeveloper} size="lg">
            <form onSubmit={handleCreateDeveloper} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input label={dict.admin.developerName} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  {errors.name && <p role="alert" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input label={dict.admin.developerSlug} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={dict.admin.developerSlug} />
                </div>
                <Input label={dict.admin.developerEmail} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <Input label={dict.admin.developerPhone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <Input label={dict.admin.developerWebsite} value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                <Input label={dict.admin.developerLogo} value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.developerDescription}</label>
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
              <p className="text-gray-600">{dict.admin.deleteDeveloper}</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{dict.common.cancel}</Button>
                <Button variant="danger" onClick={handleDeleteDeveloper} isLoading={saving}>{dict.common.delete}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

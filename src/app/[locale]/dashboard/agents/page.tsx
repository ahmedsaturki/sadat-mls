"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import { getFirstPasswordError } from "@/lib/security/password-rules";

interface Agent {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AgentsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [officeId, setOfficeId] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const dict = getMessages(locale);

  const mountedRef = useRef(true);

  const loadAgents = useCallback(async () => {
    try {
      if (!user || !mountedRef.current) return;

      if (!profile?.officeId) {
        setLoading(false);
        return;
      }

      setOfficeId(profile.officeId);

      const { data, error: agentsError } = await supabase
        .from("users")
        .select("id, email, full_name, role, is_active, created_at")
        .eq("office_id", profile.officeId)
        .eq("role", ROLES.OFFICE_AGENT)
        .order("created_at", { ascending: false });

      if (agentsError) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        setAgents(data || []);
      }
    } catch (err) {
      logger.error("Failed to fetch agents", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError, user, profile]);

  useEffect(() => {
    mountedRef.current = true;
    if (user && profile) {
      loadAgents();
    }
    return () => { mountedRef.current = false; };
  }, [loadAgents, user, profile]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Client-side password complexity check (mirrors server-side PasswordService.validate)
    // Server-only module cannot be imported in client components; uses shared rules module.
    const passwordErr = getFirstPasswordError(formData.password);
    if (passwordErr) {
      showToast(passwordErr, "error");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          office_id: officeId,
          role: ROLES.OFFICE_AGENT,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast(result.error || dict.common.unexpectedError, "error");
        return;
      }

      showToast(dict.common.add, "success");
      setShowModal(false);
      setFormData({ name: "", email: "", password: "" });
      loadAgents();
    } catch (err) {
      logger.error("Failed to create agent", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteAgent = async () => {
    if (!deleteId) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/agents?id=${deleteId}`, { 
        method: "DELETE",
        headers: getCsrfHeaders(),
      });

      if (!res.ok) {
        const result = await res.json();
        showToast(result.error || dict.common.unexpectedError, "error");
        return;
      }

      showToast(dict.common.delete, "success");
      setShowDeleteModal(false);
      setDeleteId(null);
      loadAgents();
    } catch (err) {
      logger.error("Failed to delete agent", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.office.manageAgents}
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 ml-2" />
                {dict.office.addAgent}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={agents}
                searchKey="full_name"
                searchPlaceholder={dict.office.searchAgents}
                emptyMessage={dict.common.noData}
                emptyIcon={<UserPlus className="w-12 h-12 text-purple-300" />}
                emptyHint={dict.contactRequests.noAgentsHint}
                columns={[
                  {
                    key: "full_name",
                    header: dict.office.agentName,
                    render: (agent) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="font-medium text-gray-900">{agent.full_name}</p>
                      </div>
                    ),
                  },
                  {
                    key: "email",
                    header: dict.common.email,
                    render: (agent) => agent.email,
                  },
                  {
                    key: "created_at",
                    header: dict.common.createdAt,
                    render: (agent) => (
                      <span className="text-sm text-gray-500">
                        {new Date(agent.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: dict.common.actions,
                    render: (agent) => (
                      <button
                        onClick={() => confirmDelete(agent.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        title={dict.common.delete}
                        aria-label={dict.common.delete}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {/* Add Agent Modal */}
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={dict.office.addAgent}>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <Input
                label={dict.office.agentName}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label={dict.office.agentEmail}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label={dict.office.agentPassword}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" isLoading={saving}>
                  {dict.common.save}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title={dict.common.confirm}
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                {dict.contactRequests.confirmDeleteAgent}
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                  {dict.common.cancel}
                </Button>
                <Button variant="danger" onClick={handleDeleteAgent} isLoading={saving}>
                  {dict.common.delete}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

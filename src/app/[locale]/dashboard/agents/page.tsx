"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Plus, Trash2, UserPlus, Download, Edit } from "lucide-react";
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });
  const [editForm, setEditForm] = useState({ full_name: "", email: "", is_active: true });
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

  const [inviteLink, setInviteLink] = useState("");

  const handleInviteAgent = async () => {
    if (!inviteEmail || !officeId) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail, officeId }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast(result.error || dict.common.unexpectedError, "error");
        return;
      }

      // Show invitation link for manual sharing
      setInviteLink(result.invitationUrl);
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err) {
      logger.error("Failed to send invitation", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
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
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          officeId,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/agents?id=${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
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

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.agent) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast(dict.common.unexpectedError, "error");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          id: editModal.agent.id,
          full_name: editForm.full_name,
          email: editForm.email,
          is_active: editForm.is_active,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        showToast(result.error || dict.common.unexpectedError, "error");
        return;
      }

      showToast(dict.office.agentUpdated, "success");
      setEditModal({ open: false, agent: null });
      loadAgents();
    } catch (err) {
      logger.error("Failed to update agent", { error: err instanceof Error ? err.message : String(err) });
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
              <div className="flex gap-2">
                {officeId && (
                  <Button variant="outline" onClick={() => window.open(`/api/export?type=agents&officeId=${officeId}`, "_blank")}>
                    <Download className="w-4 h-4 ms-2" />
                    CSV
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="w-4 h-4 ms-2" />
                  {dict.office.inviteAgent || "Invite Agent"}
                </Button>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 ms-2" />
                  {dict.office.addAgent}
                </Button>
              </div>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditForm({
                              full_name: agent.full_name,
                              email: agent.email,
                              is_active: agent.is_active,
                            });
                            setEditModal({ open: true, agent });
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={dict.office.editAgent}
                          aria-label={dict.office.editAgent}
                        >
                          <Edit className="w-4 h-4 text-navy-600" />
                        </button>
                        <button
                          onClick={() => confirmDelete(agent.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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

          {/* Invite Agent Modal */}
          <Modal
            isOpen={showInviteModal}
            onClose={() => { setShowInviteModal(false); setInviteEmail(""); }}
            title={dict.office.inviteAgent || "Invite Agent"}
          >
            <form onSubmit={(e) => { e.preventDefault(); handleInviteAgent(); }} className="space-y-4">
              <Input
                label={dict.common.email}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                {dict.office.invitationDesc || "An invitation link will be sent to this email address."}
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => { setShowInviteModal(false); setInviteEmail(""); }}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" isLoading={saving}>
                  {dict.office.inviteAgent || "Invite Agent"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Invitation Link Display */}
          <Modal
            isOpen={!!inviteLink}
            onClose={() => setInviteLink("")}
            title={dict.office.invitationSent || "Invitation Link"}
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Copy this link and share it with the agent:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    showToast("Copied!", "success");
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setInviteLink("")}>
                  {dict.common.close || "Close"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Edit Agent Modal */}
          <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, agent: null })} title={dict.office.editAgent}>
            <form onSubmit={handleEditAgent} className="space-y-4">
              <Input
                label={dict.office.agentName}
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
              <Input
                label={dict.common.email}
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{dict.office.agentStatus}</label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.is_active ? "bg-green-600" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={editForm.is_active}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editForm.is_active ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-sm text-gray-600">{editForm.is_active ? dict.common.active : dict.common.inactive}</span>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditModal({ open: false, agent: null })}>
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

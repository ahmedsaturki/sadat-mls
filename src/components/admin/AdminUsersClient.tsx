"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { Users, Trash2, Shield, ShieldCheck, ShieldOff, UserPlus, Edit } from "lucide-react";
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
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import { getFirstPasswordError } from "@/lib/security/password-rules";

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  office_id: string | null;
  office_name: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}

const ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, labelKey: "roles.superAdmin" },
  { value: ROLES.OFFICE_ADMIN, labelKey: "roles.officeAdmin" },
  { value: ROLES.OFFICE_AGENT, labelKey: "roles.officeAgent" },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  office_admin: "bg-navy-100 text-navy-700",
  office_agent: "bg-green-100 text-green-700",
};

export default function AdminUsersClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const dict = getMessages(locale as Locale);
  const { supabase, user } = useAuthUser();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserRecord | null }>({ open: false, user: null });
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: UserRecord | null }>({ open: false, user: null });
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{ email: string; password: string; full_name: string; role: UserRole }>({ email: "", password: "", full_name: "", role: ROLES.OFFICE_AGENT });
  const [editModal, setEditModal] = useState<{ open: boolean; user: UserRecord | null }>({ open: false, user: null });
  const [editForm, setEditForm] = useState({ full_name: "", email: "", role: ROLES.OFFICE_AGENT, is_active: true });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const mountedRef = useRef(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter) params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();

      if (mountedRef.current) {
        setUsers(data.users || []);
      }
    } catch (err) {
      logger.error("Failed to fetch users", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, searchQuery, roleFilter, dict.common.unexpectedError, showToast]);

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => { mountedRef.current = false; };
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/admin/users?id=${deleteModal.user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");
      showToast(dict.admin.userDeleted, "success");
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      logger.error("Failed to delete user", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!roleModal.user) return;
    setUpdating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({ userId: roleModal.user.id, role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update role");
      showToast(dict.admin.roleChanged, "success");
      setRoleModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      logger.error("Failed to update role", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.user) return;
    setUpdating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          userId: editModal.user.id,
          fullName: editForm.full_name,
          email: editForm.email,
          role: editForm.role,
          is_active: editForm.is_active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update user");
      showToast(dict.admin.userUpdated, "success");
      setEditModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      logger.error("Failed to update user", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    // Client-side password complexity check (mirrors server-side PasswordService.validate)
    // Server-only module cannot be imported in client components; uses shared rules module.
    const passwordErr = getFirstPasswordError(createForm.password);
    if (passwordErr) {
      showToast(passwordErr, "error");
      setCreating(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...getCsrfHeaders(),
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dict.common.unexpectedError);
      }

      showToast(dict.admin.userCreated, "success");
      setCreateModal(false);
      setCreateForm({ email: "", password: "", full_name: "", role: ROLES.OFFICE_AGENT });
      fetchUsers();
    } catch (err) {
      logger.error("Failed to create user", { error: err instanceof Error ? err.message : String(err) });
      showToast(err instanceof Error ? err.message : dict.common.unexpectedError, "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const idStr = String(id);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Delete users sequentially (API only supports single delete)
      const ids = Array.from(selectedIds);
      let failed = 0;
      for (const id of ids) {
        try {
          const response = await fetch(`/api/admin/users?id=${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              ...getCsrfHeaders(),
            },
          });
          if (!response.ok) failed++;
        } catch {
          failed++;
        }
      }

      if (failed === 0) {
        showToast(dict.admin.bulkDeleteSuccess, "success");
      } else if (failed < ids.length) {
        showToast(dict.admin.bulkDeleteSuccess, "success");
      } else {
        showToast(dict.common.unexpectedError, "error");
      }

      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      fetchUsers();
    } catch (err) {
      logger.error("Failed to bulk delete users", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case ROLES.SUPER_ADMIN: return dict.roles.superAdmin;
      case ROLES.OFFICE_ADMIN: return dict.roles.officeAdmin;
      case ROLES.OFFICE_AGENT: return dict.roles.officeAgent;
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case ROLES.SUPER_ADMIN: return ShieldCheck;
      case ROLES.OFFICE_ADMIN: return Shield;
      case ROLES.OFFICE_AGENT: return ShieldOff;
      default: return Shield;
    }
  };

  const columns = [
    {
      key: "full_name" as const,
      header: dict.admin.columnName,
      render: (u: UserRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy-100 rounded-full flex items-center justify-center text-sm font-semibold text-navy-600">
            {(u.full_name || u.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{u.full_name}</p>
            <p className="text-sm text-gray-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role" as const,
      header: dict.admin.columnRole,
      render: (u: UserRecord) => {
        const RoleIcon = getRoleIcon(u.role);
        return (
          <div className="flex items-center gap-2">
            <RoleIcon className="w-4 h-4 text-gray-500" />
            <Badge className={ROLE_BADGE_COLORS[u.role] || "bg-gray-100 text-gray-700"}>
              {getRoleLabel(u.role)}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "office_name" as const,
      header: dict.admin.columnOffice,
      render: (u: UserRecord) => (
        <span className="text-sm text-gray-600">{u.office_name || "-"}</span>
      ),
    },
    {
      key: "created_at" as const,
      header: dict.admin.columnDate,
      render: (u: UserRecord) => (
        <span className="text-sm text-gray-500">
          {new Date(u.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
        </span>
      ),
    },
    {
      key: "id" as const,
      header: dict.admin.columnActions,
      render: (u: UserRecord) => (
        <div className="flex items-center gap-2">
          {u.id !== user?.id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditForm({
                    full_name: u.full_name,
                    email: u.email,
                    role: u.role as UserRole,
                    is_active: u.is_active ?? true,
                  });
                  setEditModal({ open: true, user: u });
                }}
                aria-label={dict.admin.editUser}
              >
                <Edit className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRoleModal({ open: true, user: u })}
                aria-label={dict.admin.changeRole}
              >
                 <Shield className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal({ open: true, user: u })}
                aria-label={dict.admin.deleteUser}
                className="text-red-600 hover:text-red-700"
              >
                 <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <ErrorBoundary>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader title={dict.admin.usersTitle} />
            <Button onClick={() => setCreateModal(true)}>
               <UserPlus className="w-4 h-4 me-2" aria-hidden="true" />
              {dict.admin.addUser}
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.admin.searchUsers}
                  aria-label={dict.common.search}
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                  aria-label={dict.admin.columnRole}
                >
                  <option value="">{dict.common.all}</option>
                  <option value={ROLES.SUPER_ADMIN}>{dict.roles.superAdmin}</option>
                  <option value={ROLES.OFFICE_ADMIN}>{dict.roles.officeAdmin}</option>
                  <option value={ROLES.OFFICE_AGENT}>{dict.roles.officeAgent}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          {loading ? (
            <SkeletonTable />
          ) : users.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{dict.admin.noUsers}</p>
                <p className="text-sm text-gray-500 mt-1">{dict.admin.noUsersHint}</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Bulk Action Toolbar */}
              {selectedIds.size > 0 && (
                <Card padding="sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-navy-700">
                      {dict.admin.selectedItems.replace("{{count}}", String(selectedIds.size))}
                    </span>
                    <div className="me-auto" />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowBulkDeleteModal(true)}
                      disabled={bulkLoading}
                    >
                      <Trash2 className="w-4 h-4 ms-1" aria-hidden="true" />
                      {dict.admin.bulkDelete}
                    </Button>
                  </div>
                </Card>
              )}

              <PaginatedTable
                data={users}
                columns={columns}
                pageSize={10}
                searchKey="full_name"
                searchPlaceholder={dict.admin.searchUsers}
                emptyMessage={dict.admin.noUsers}
                dir={locale === "ar" ? "rtl" : "ltr"}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={toggleSelectAll}
                selectAllLabel={selectedIds.size === users.length ? dict.admin.deselectAll : dict.admin.selectAll}
              />
            </>
          )}
        </div>

        {/* Edit User Modal */}
        <Modal
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, user: null })}
          title={dict.admin.editUser}
        >
          <form onSubmit={handleEditUser} className="space-y-4">
            <Input
              label={dict.admin.createUserName}
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              required
            />
            <Input
              type="email"
              label={dict.admin.createUserEmail}
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.createUserRole}</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{getRoleLabel(opt.value)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{dict.common.status}</label>
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
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setEditModal({ open: false, user: null })}>
                {dict.common.cancel}
              </Button>
              <Button type="submit" isLoading={updating}>
                {dict.common.save}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, user: null })}
          title={dict.admin.deleteUser}
        >
          <div className="space-y-4">
            <p className="text-gray-600">{dict.admin.confirmDeleteUser}</p>
            {deleteModal.user && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{deleteModal.user.full_name || deleteModal.user.email}</p>
                <p className="text-sm text-gray-500">{deleteModal.user.email}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteModal({ open: false, user: null })}
              >
                {dict.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleting}
              >
                {dict.common.delete}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          title={dict.common.confirm}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">{dict.admin.confirmBulkDelete.replace("{{count}}", String(selectedIds.size))}</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowBulkDeleteModal(false)}
              >
                {dict.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                isLoading={bulkLoading}
              >
                {dict.common.delete}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Role Change Modal */}
        <Modal
          isOpen={roleModal.open}
          onClose={() => setRoleModal({ open: false, user: null })}
          title={dict.admin.changeRole}
        >
          <div className="space-y-4">
            {roleModal.user && (
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="font-medium">{roleModal.user.full_name || roleModal.user.email}</p>
                <p className="text-sm text-gray-500">{roleModal.user.email}</p>
              </div>
            )}
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = getRoleIcon(opt.value);
                const isSelected = roleModal.user?.role === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleRoleChange(opt.value)}
                    disabled={isSelected || updating}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-navy-300 bg-navy-50 text-navy-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{getRoleLabel(opt.value)}</p>
                    </div>
                    {isSelected && (
                      <span className="me-auto text-xs bg-navy-100 text-navy-700 px-2 py-1 rounded-full">
                        {dict.common.current}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setRoleModal({ open: false, user: null })}
              >
                {dict.common.close}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create User Modal */}
        <Modal
          isOpen={createModal}
          onClose={() => setCreateModal(false)}
          title={dict.admin.createUserTitle}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              type="email"
              label={dict.admin.createUserEmail}
              placeholder={dict.admin.createUserEmailPlaceholder}
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <Input
              type="password"
              label={dict.admin.createUserPassword}
              placeholder={dict.admin.createUserPasswordPlaceholder}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              minLength={8}
            />
            <Input
              label={dict.admin.createUserName}
              placeholder={dict.admin.createUserNamePlaceholder}
              value={createForm.full_name}
              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.createUserRole}</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{getRoleLabel(opt.value)}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>
                {dict.common.cancel}
              </Button>
              <Button type="submit" isLoading={creating}>
                {dict.admin.createUserButton}
              </Button>
            </div>
          </form>
        </Modal>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

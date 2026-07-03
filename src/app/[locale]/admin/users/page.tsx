"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { Users, Trash2, Shield, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
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
import { getCsrfHeaders } from "@/lib/security/csrf-client";

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
  office_admin: "bg-blue-100 text-blue-700",
  office_agent: "bg-green-100 text-green-700",
};

export default function AdminUsersPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const dict = getMessages(locale);
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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

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
        throw new Error(data.error || "Failed to create user");
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
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
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
            <RoleIcon className="w-4 h-4 text-gray-400" />
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
                onClick={() => setRoleModal({ open: true, user: u })}
                aria-label={dict.admin.changeRole}
              >
                <Shield className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal({ open: true, user: u })}
                aria-label={dict.admin.deleteUser}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
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
              <UserPlus className="w-4 h-4 mr-2" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                <p className="text-sm text-gray-400 mt-1">{dict.admin.noUsersHint}</p>
              </div>
            </Card>
          ) : (
            <PaginatedTable
              data={users}
              columns={columns}
              pageSize={10}
              searchKey="full_name"
              searchPlaceholder={dict.admin.searchUsers}
              emptyMessage={dict.admin.noUsers}
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          )}
        </div>

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
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{getRoleLabel(opt.value)}</p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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

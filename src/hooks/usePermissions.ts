"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { hasPermission, hasAllPermissions, hasAnyPermission } from "@/lib/permissions";
import type { UserRole, Permission } from "@/lib/utils/constants";

export function usePermissions() {
  const { profile, isLoading } = useAuthUser();
  const role = (profile?.role as UserRole) ?? null;

  return {
    role,
    loading: isLoading,
    can: (permission: Permission) => hasPermission(role, permission),
    canAll: (permissions: readonly Permission[]) => hasAllPermissions(role, permissions),
    canAny: (permissions: readonly Permission[]) => hasAnyPermission(role, permissions),
  };
}

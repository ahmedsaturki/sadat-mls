import {
  ROLE_PERMISSIONS,
  type UserRole,
  type Permission,
} from "@/lib/utils/constants";

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return (perms as readonly Permission[]).includes(permission);
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(
  role: UserRole | undefined | null,
  permissions: readonly Permission[]
): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(
  role: UserRole | undefined | null,
  permissions: readonly Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a given role.
 */
export function getRolePermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

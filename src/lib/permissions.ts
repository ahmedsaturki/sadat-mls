import { type UserRole, type Permission, ROLE_PERMISSIONS } from "@/lib/utils/constants";

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function hasAllPermissions(role: UserRole | null | undefined, permissions: readonly Permission[]): boolean {
  if (!role) return false;
  const granted = ROLE_PERMISSIONS[role] || [];
  return permissions.every((p) => granted.includes(p));
}

export function hasAnyPermission(role: UserRole | null | undefined, permissions: readonly Permission[]): boolean {
  if (!role) return false;
  const granted = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => granted.includes(p));
}

export function getPermissions(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

export { ROLES } from "@/lib/utils/constants";

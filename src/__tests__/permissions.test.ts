import { describe, it, expect } from "vitest";
import { hasPermission, hasAllPermissions, hasAnyPermission, getPermissions } from "@/lib/permissions";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/utils/constants";

describe("permissions", () => {
  describe("hasPermission", () => {
    it("returns false for null role", () => {
      expect(hasPermission(null, PERMISSIONS.OFFICE_VIEW)).toBe(false);
    });

    it("returns false for undefined role", () => {
      expect(hasPermission(undefined, PERMISSIONS.OFFICE_VIEW)).toBe(false);
    });

    it("returns true for super_admin with office:view", () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.OFFICE_VIEW)).toBe(true);
    });

    it("returns true for super_admin with all permissions", () => {
      const allPerms = Object.values(PERMISSIONS);
      for (const perm of allPerms) {
        expect(hasPermission(ROLES.SUPER_ADMIN, perm)).toBe(true);
      }
    });

    it("returns false for office_agent with office:create", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.OFFICE_CREATE)).toBe(false);
    });

    it("returns true for office_agent with property:create", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.PROPERTY_CREATE)).toBe(true);
    });

    it("returns true for office_admin with contact:update", () => {
      expect(hasPermission(ROLES.OFFICE_ADMIN, PERMISSIONS.CONTACT_UPDATE)).toBe(true);
    });

    it("returns false for office_admin with office:delete", () => {
      expect(hasPermission(ROLES.OFFICE_ADMIN, PERMISSIONS.OFFICE_DELETE)).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns false for null role", () => {
      expect(hasAllPermissions(null, [PERMISSIONS.OFFICE_VIEW])).toBe(false);
    });

    it("returns true for super_admin with multiple permissions", () => {
      expect(hasAllPermissions(ROLES.SUPER_ADMIN, [
        PERMISSIONS.OFFICE_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.ANALYTICS_VIEW,
      ])).toBe(true);
    });

    it("returns false when one permission is missing", () => {
      expect(hasAllPermissions(ROLES.OFFICE_AGENT, [
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.OFFICE_CREATE,
      ])).toBe(false);
    });

    it("returns true for office_agent with own permissions", () => {
      expect(hasAllPermissions(ROLES.OFFICE_AGENT, [
        PERMISSIONS.PROPERTY_VIEW,
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.PROPERTY_UPDATE,
      ])).toBe(true);
    });

    it("returns true for empty permissions array", () => {
      expect(hasAllPermissions(ROLES.OFFICE_AGENT, [])).toBe(true);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns false for null role", () => {
      expect(hasAnyPermission(null, [PERMISSIONS.OFFICE_VIEW])).toBe(false);
    });

    it("returns true if any permission matches", () => {
      expect(hasAnyPermission(ROLES.OFFICE_AGENT, [
        PERMISSIONS.OFFICE_CREATE,
        PERMISSIONS.PROPERTY_CREATE,
      ])).toBe(true);
    });

    it("returns false if no permission matches", () => {
      expect(hasAnyPermission(ROLES.OFFICE_AGENT, [
        PERMISSIONS.OFFICE_CREATE,
        PERMISSIONS.OFFICE_DELETE,
        PERMISSIONS.ANALYTICS_VIEW,
      ])).toBe(false);
    });

    it("returns true for empty permissions array", () => {
      expect(hasAnyPermission(ROLES.OFFICE_AGENT, [])).toBe(false);
    });
  });

  describe("getPermissions", () => {
    it("returns a copy of super_admin permissions", () => {
      const perms = getPermissions(ROLES.SUPER_ADMIN);
      expect(perms).toEqual(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]);
      expect(perms).not.toBe(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]);
    });

    it("returns office_agent permissions", () => {
      const perms = getPermissions(ROLES.OFFICE_AGENT);
      expect(perms).toContain(PERMISSIONS.PROPERTY_VIEW);
      expect(perms).toContain(PERMISSIONS.PROPERTY_CREATE);
      expect(perms).not.toContain(PERMISSIONS.OFFICE_CREATE);
    });

    it("returns empty array for unknown role", () => {
      const perms = getPermissions("unknown_role" as never);
      expect(perms).toEqual([]);
    });
  });

  describe("role hierarchy", () => {
    it("super_admin has more permissions than office_admin", () => {
      expect(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN].length)
        .toBeGreaterThan(ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN].length);
    });

    it("office_admin has more permissions than office_agent", () => {
      expect(ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN].length)
        .toBeGreaterThan(ROLE_PERMISSIONS[ROLES.OFFICE_AGENT].length);
    });

    it("office_agent cannot manage offices", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.OFFICE_CREATE)).toBe(false);
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.OFFICE_DELETE)).toBe(false);
    });

    it("office_admin cannot change user roles", () => {
      expect(hasPermission(ROLES.OFFICE_ADMIN, PERMISSIONS.USER_ROLE_CHANGE)).toBe(false);
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  ROLES,
  PROPERTY_STATUSES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type UserRole,
  type Permission,
} from "@/lib/utils/constants";

describe("ROLES", () => {
  it("exposes the three expected role identifiers", () => {
    expect(ROLES.SUPER_ADMIN).toBe("super_admin");
    expect(ROLES.OFFICE_ADMIN).toBe("office_admin");
    expect(ROLES.OFFICE_AGENT).toBe("office_agent");
  });

  it("contains exactly three roles", () => {
    expect(Object.keys(ROLES)).toHaveLength(3);
  });

  it("identifies a user role", () => {
    const role: UserRole = ROLES.SUPER_ADMIN;
    expect(role).toBe("super_admin");
  });
});

describe("PROPERTY_STATUSES", () => {
  it("contains all five expected statuses", () => {
    expect([...PROPERTY_STATUSES]).toEqual([
      "available",
      "reserved",
      "sold",
      "rented",
      "pending_review",
    ]);
  });

  it("contains no duplicate statuses", () => {
    expect(new Set(PROPERTY_STATUSES).size).toBe(PROPERTY_STATUSES.length);
  });
});

describe("PERMISSIONS", () => {
  it("includes office management permissions", () => {
    expect(PERMISSIONS.OFFICE_VIEW).toBe("office:view");
    expect(PERMISSIONS.OFFICE_CREATE).toBe("office:create");
    expect(PERMISSIONS.OFFICE_UPDATE).toBe("office:update");
    expect(PERMISSIONS.OFFICE_DELETE).toBe("office:delete");
    expect(PERMISSIONS.OFFICE_DEACTIVATE).toBe("office:deactivate");
  });

  it("includes user management permissions", () => {
    expect(PERMISSIONS.USER_VIEW).toBe("user:view");
    expect(PERMISSIONS.USER_CREATE).toBe("user:create");
    expect(PERMISSIONS.USER_UPDATE).toBe("user:update");
    expect(PERMISSIONS.USER_DELETE).toBe("user:delete");
    expect(PERMISSIONS.USER_ROLE_CHANGE).toBe("user:role_change");
  });

  it("includes property management permissions", () => {
    expect(PERMISSIONS.PROPERTY_VIEW).toBe("property:view");
    expect(PERMISSIONS.PROPERTY_CREATE).toBe("property:create");
    expect(PERMISSIONS.PROPERTY_UPDATE).toBe("property:update");
    expect(PERMISSIONS.PROPERTY_DELETE).toBe("property:delete");
  });

  it("includes contact request permissions", () => {
    expect(PERMISSIONS.CONTACT_VIEW).toBe("contact:view");
    expect(PERMISSIONS.CONTACT_UPDATE).toBe("contact:update");
    expect(PERMISSIONS.CONTACT_DELETE).toBe("contact:delete");
  });

  it("includes zone and property-type CRUD permissions", () => {
    for (const op of ["VIEW", "CREATE", "UPDATE", "DELETE"]) {
      const lower = op.toLowerCase();
      const zoneKey = `ZONE_${op}` as keyof typeof PERMISSIONS;
      const typeKey = `PROPERTY_TYPE_${op}` as keyof typeof PERMISSIONS;
      expect(PERMISSIONS[zoneKey]).toBe(`zone:${lower}`);
      expect(PERMISSIONS[typeKey]).toBe(`property_type:${lower}`);
    }
  });

  it("includes analytics and settings permissions", () => {
    expect(PERMISSIONS.ANALYTICS_VIEW).toBe("analytics:view");
    expect(PERMISSIONS.SETTINGS_VIEW).toBe("settings:view");
    expect(PERMISSIONS.SETTINGS_OFFICE_UPDATE).toBe("settings:office_update");
  });

  it("contains no duplicate permission strings", () => {
    const all = Object.values(PERMISSIONS);
    expect(new Set(all).size).toBe(all.length);
  });

  it("every permission follows the resource:action pattern", () => {
    for (const v of Object.values(PERMISSIONS)) {
      expect(v).toMatch(/^[a-z_]+:[a-z_]+$/);
    }
  });
});

describe("ROLE_PERMISSIONS", () => {
  const everyPermission = Object.values(PERMISSIONS) as Permission[];
  const roles: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.OFFICE_ADMIN, ROLES.OFFICE_AGENT];

  it("defines an entry for every role", () => {
    for (const r of roles) {
      expect(ROLE_PERMISSIONS[r]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[r])).toBe(true);
    }
  });

  it("super_admin has every permission", () => {
    const granted = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN];
    for (const p of everyPermission) {
      expect(granted).toContain(p);
    }
  });

  it("super_admin has the most permissions (no other role does)", () => {
    const superCount = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN].length;
    expect(superCount).toBeGreaterThan(
      ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN].length,
    );
    expect(superCount).toBeGreaterThan(
      ROLE_PERMISSIONS[ROLES.OFFICE_AGENT].length,
    );
  });

  it("office_admin can manage users but not change roles", () => {
    const granted = ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN];
    expect(granted).toContain(PERMISSIONS.USER_CREATE);
    expect(granted).toContain(PERMISSIONS.USER_DELETE);
    expect(granted).not.toContain(PERMISSIONS.USER_ROLE_CHANGE);
  });

  it("office_admin cannot create / delete offices (view only)", () => {
    const granted = ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN];
    expect(granted).toContain(PERMISSIONS.OFFICE_VIEW);
    expect(granted).not.toContain(PERMISSIONS.OFFICE_CREATE);
    expect(granted).not.toContain(PERMISSIONS.OFFICE_DELETE);
  });

  it("office_agent can only manage properties, no user or office management", () => {
    const granted = ROLE_PERMISSIONS[ROLES.OFFICE_AGENT];
    expect(granted).toEqual(
      expect.arrayContaining([
        PERMISSIONS.PROPERTY_VIEW,
        PERMISSIONS.PROPERTY_CREATE,
        PERMISSIONS.PROPERTY_UPDATE,
        PERMISSIONS.PROPERTY_DELETE,
      ]),
    );
    expect(granted).not.toContain(PERMISSIONS.USER_CREATE);
    expect(granted).not.toContain(PERMISSIONS.OFFICE_CREATE);
    expect(granted).not.toContain(PERMISSIONS.ANALYTICS_VIEW);
  });

  it("every role can view properties", () => {
    for (const r of roles) {
      expect(ROLE_PERMISSIONS[r]).toContain(PERMISSIONS.PROPERTY_VIEW);
    }
  });

  it("only super_admin can view analytics", () => {
    expect(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]).toContain(PERMISSIONS.ANALYTICS_VIEW);
    expect(ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN]).not.toContain(PERMISSIONS.ANALYTICS_VIEW);
    expect(ROLE_PERMISSIONS[ROLES.OFFICE_AGENT]).not.toContain(PERMISSIONS.ANALYTICS_VIEW);
  });

  it("office_agent has the smallest permission set", () => {
    expect(ROLE_PERMISSIONS[ROLES.OFFICE_AGENT].length).toBeLessThan(
      ROLE_PERMISSIONS[ROLES.OFFICE_ADMIN].length,
    );
  });
});

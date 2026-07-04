import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasPermission, hasAllPermissions, hasAnyPermission, getRolePermissions } from "@/lib/permissions";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, type UserRole, type Permission } from "@/lib/utils/constants";
import { authSchemas } from "@/lib/validation";

// ── Permission System Tests ────────────────────────────────────────────

describe("Permission System", () => {
  describe("hasPermission", () => {
    it("returns false for undefined role", () => {
      expect(hasPermission(undefined, PERMISSIONS.PROPERTY_VIEW)).toBe(false);
    });

    it("returns false for null role", () => {
      expect(hasPermission(null, PERMISSIONS.PROPERTY_VIEW)).toBe(false);
    });

    it("returns true when role has the permission", () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.OFFICE_CREATE)).toBe(true);
    });

    it("returns false when role lacks the permission", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.OFFICE_CREATE)).toBe(false);
    });

    it("office_admin can view offices", () => {
      expect(hasPermission(ROLES.OFFICE_ADMIN, PERMISSIONS.OFFICE_VIEW)).toBe(true);
    });

    it("office_admin cannot delete offices", () => {
      expect(hasPermission(ROLES.OFFICE_ADMIN, PERMISSIONS.OFFICE_DELETE)).toBe(false);
    });

    it("office_agent can create properties", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.PROPERTY_CREATE)).toBe(true);
    });

    it("office_agent cannot manage users", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.USER_VIEW)).toBe(false);
    });

    it("office_agent can view contacts", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.CONTACT_VIEW)).toBe(true);
    });

    it("office_agent cannot update contacts", () => {
      expect(hasPermission(ROLES.OFFICE_AGENT, PERMISSIONS.CONTACT_UPDATE)).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns false when any permission is missing", () => {
      expect(
        hasAllPermissions(ROLES.OFFICE_AGENT, [
          PERMISSIONS.PROPERTY_VIEW,
          PERMISSIONS.OFFICE_CREATE,
        ])
      ).toBe(false);
    });

    it("returns true when all permissions are present", () => {
      expect(
        hasAllPermissions(ROLES.SUPER_ADMIN, [
          PERMISSIONS.PROPERTY_VIEW,
          PERMISSIONS.OFFICE_CREATE,
          PERMISSIONS.USER_DELETE,
        ])
      ).toBe(true);
    });

    it("returns false for undefined role", () => {
      expect(
        hasAllPermissions(undefined, [PERMISSIONS.PROPERTY_VIEW])
      ).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when at least one permission is present", () => {
      expect(
        hasAnyPermission(ROLES.OFFICE_AGENT, [
          PERMISSIONS.OFFICE_CREATE,
          PERMISSIONS.PROPERTY_VIEW,
        ])
      ).toBe(true);
    });

    it("returns false when no permissions are present", () => {
      expect(
        hasAnyPermission(ROLES.OFFICE_AGENT, [
          PERMISSIONS.OFFICE_CREATE,
          PERMISSIONS.USER_DELETE,
        ])
      ).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("returns all permissions for super_admin", () => {
      const perms = getRolePermissions(ROLES.SUPER_ADMIN);
      expect(perms.length).toBeGreaterThan(10);
      expect(perms).toContain(PERMISSIONS.OFFICE_CREATE);
      expect(perms).toContain(PERMISSIONS.USER_DELETE);
      expect(perms).toContain(PERMISSIONS.ANALYTICS_VIEW);
    });

    it("returns limited permissions for office_agent", () => {
      const perms = getRolePermissions(ROLES.OFFICE_AGENT);
      expect(perms.length).toBeLessThan(
        getRolePermissions(ROLES.SUPER_ADMIN).length
      );
      expect(perms).toContain(PERMISSIONS.PROPERTY_VIEW);
    });

    it("returns empty array for unknown role", () => {
      // @ts-expect-error - intentionally bad input
      expect(getRolePermissions("unknown_role")).toEqual([]);
    });
  });
});

// ── Auth Validation Schema Tests ───────────────────────────────────────

describe("Auth Validation Schemas", () => {
  describe("login schema", () => {
    it("accepts valid email and password", () => {
      const result = authSchemas.login.safeParse({
        email: "user@example.com",
        password: "Password1!",
        rememberMe: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = authSchemas.login.safeParse({
        email: "not-an-email",
        password: "Password1!",
        rememberMe: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = authSchemas.login.safeParse({
        email: "user@example.com",
        password: "",
        rememberMe: false,
      });
      expect(result.success).toBe(false);
    });

    it("defaults rememberMe to false", () => {
      const result = authSchemas.login.safeParse({
        email: "user@example.com",
        password: "Password1!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(false);
      }
    });
  });

  describe("register schema", () => {
    it("accepts valid registration data", () => {
      const result = authSchemas.register.safeParse({
        fullName: "Ahmed Hassan",
        email: "ahmed@example.com",
        password: "Password1!",
        termsAccepted: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects password without uppercase", () => {
      const result = authSchemas.register.safeParse({
        fullName: "Ahmed",
        email: "ahmed@example.com",
        password: "password1!",
        termsAccepted: true,
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without special character", () => {
      const result = authSchemas.register.safeParse({
        fullName: "Ahmed",
        email: "ahmed@example.com",
        password: "Password123",
        termsAccepted: true,
      });
      expect(result.success).toBe(false);
    });

    it("rejects short name", () => {
      const result = authSchemas.register.safeParse({
        fullName: "A",
        email: "ahmed@example.com",
        password: "Password1!",
        termsAccepted: true,
      });
      expect(result.success).toBe(false);
    });

    it("rejects when terms not accepted", () => {
      const result = authSchemas.register.safeParse({
        fullName: "Ahmed",
        email: "ahmed@example.com",
        password: "Password1!",
        termsAccepted: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPassword schema", () => {
    it("accepts valid email", () => {
      const result = authSchemas.forgotPassword.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = authSchemas.forgotPassword.safeParse({
        email: "not-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPassword schema", () => {
    it("accepts matching passwords with valid token", () => {
      const result = authSchemas.resetPassword.safeParse({
        token: "valid-token",
        newPassword: "NewPassword1!",
        confirmPassword: "NewPassword1!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = authSchemas.resetPassword.safeParse({
        token: "valid-token",
        newPassword: "NewPassword1!",
        confirmPassword: "DifferentPassword1!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty token", () => {
      const result = authSchemas.resetPassword.safeParse({
        token: "",
        newPassword: "NewPassword1!",
        confirmPassword: "NewPassword1!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects weak password", () => {
      const result = authSchemas.resetPassword.safeParse({
        token: "valid-token",
        newPassword: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("changePassword schema", () => {
    it("accepts valid change password data", () => {
      const result = authSchemas.changePassword.safeParse({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword1!",
        confirmPassword: "NewPassword1!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty current password", () => {
      const result = authSchemas.changePassword.safeParse({
        currentPassword: "",
        newPassword: "NewPassword1!",
        confirmPassword: "NewPassword1!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched new passwords", () => {
      const result = authSchemas.changePassword.safeParse({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword1!",
        confirmPassword: "Different1!",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ── Auth Callback URL Safety Tests ─────────────────────────────────────

describe("Auth Callback URL Safety", () => {
  // Simulate the URL validation logic from auth/callback/route.ts

  function isHostAllowed(
    hostname: string,
    allowedHosts: Set<string>,
    envUrl: string
  ): boolean {
    if (allowedHosts.has(hostname)) return true;
    try {
      const productionHost = new URL(envUrl).hostname;
      const prefix = productionHost.split(".vercel.app")[0];
      if (prefix && hostname === `${prefix}.vercel.app`) return true;
      if (prefix && hostname.startsWith(`${prefix}-`) && hostname.endsWith(".vercel.app"))
        return true;
    } catch {
      // ignore
    }
    return false;
  }

  function buildAllowedHosts(origin: string, envUrl: string): Set<string> {
    const hosts = new Set<string>();
    hosts.add("localhost");
    hosts.add("127.0.0.1");
    if (envUrl) {
      try {
        hosts.add(new URL(envUrl).hostname);
      } catch {
        hosts.add(envUrl.replace(/^https?:\/\//, "").split("/")[0]);
      }
    }
    if (origin) {
      try {
        hosts.add(new URL(origin).hostname);
      } catch {
        // ignore
      }
    }
    return hosts;
  }

  it("allows localhost", () => {
    const hosts = buildAllowedHosts("", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("localhost", hosts, "https://sadat-mls.vercel.app")).toBe(true);
  });

  it("allows production host", () => {
    const hosts = buildAllowedHosts("", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("sadat-mls.vercel.app", hosts, "https://sadat-mls.vercel.app")).toBe(true);
  });

  it("allows Vercel preview deploys with matching prefix", () => {
    const hosts = buildAllowedHosts("", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("sadat-mls-abc123.vercel.app", hosts, "https://sadat-mls.vercel.app")).toBe(true);
  });

  it("rejects unknown external host", () => {
    const hosts = buildAllowedHosts("", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("evil-site.com", hosts, "https://sadat-mls.vercel.app")).toBe(false);
  });

  it("rejects Vercel preview with different prefix", () => {
    const hosts = buildAllowedHosts("", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("other-project-abc123.vercel.app", hosts, "https://sadat-mls.vercel.app")).toBe(false);
  });

  it("allows same-origin host", () => {
    const hosts = buildAllowedHosts("https://sadat-mls.vercel.app", "https://sadat-mls.vercel.app");
    expect(isHostAllowed("sadat-mls.vercel.app", hosts, "https://sadat-mls.vercel.app")).toBe(true);
  });

  it("sanitizes path traversal in next param", () => {
    const safeNext = (next: string) =>
      next.startsWith("/") && !next.startsWith("//") && !next.includes("://")
        ? next
        : "/";

    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("/")).toBe("/");
    expect(safeNext("")).toBe("/");
  });

  it("validates locale against allowlist", () => {
    const ALLOWED_LOCALES = ["ar", "en"];
    const safeLocale = (locale: string) =>
      ALLOWED_LOCALES.includes(locale) ? locale : "ar";

    expect(safeLocale("ar")).toBe("ar");
    expect(safeLocale("en")).toBe("en");
    expect(safeLocale("fr")).toBe("ar");
    expect(safeLocale("")).toBe("ar");
  });
});

// ── Password Strength / Rules Tests ────────────────────────────────────

describe("Password Strength in Reset Flow", () => {
  const { getPasswordRuleErrors } = require("@/lib/security/password-rules");

  it("rejects empty password", () => {
    const errors = getPasswordRuleErrors("");
    expect(errors).toContain("Password is required");
  });

  it("rejects password shorter than 8 chars", () => {
    const errors = getPasswordRuleErrors("Ab1!");
    expect(errors).toContain("Password must be at least 8 characters long");
  });

  it("rejects password longer than 128 chars", () => {
    const long = "Aa1!" + "x".repeat(200);
    const errors = getPasswordRuleErrors(long);
    expect(errors).toContain("Password cannot exceed 128 characters");
  });

  it("rejects password without uppercase", () => {
    const errors = getPasswordRuleErrors("lowercase1!");
    expect(errors).toContain("Password must contain at least one uppercase letter");
  });

  it("rejects password without lowercase", () => {
    const errors = getPasswordRuleErrors("UPPERCASE1!");
    expect(errors).toContain("Password must contain at least one lowercase letter");
  });

  it("rejects password without number", () => {
    const errors = getPasswordRuleErrors("NoNumber!");
    expect(errors).toContain("Password must contain at least one number");
  });

  it("rejects password without special character", () => {
    const errors = getPasswordRuleErrors("NoSpecial1");
    expect(errors).toContain("Password must contain at least one special character");
  });

  it("accepts a fully valid password", () => {
    const errors = getPasswordRuleErrors("Valid1!pass");
    expect(errors).toEqual([]);
  });
});

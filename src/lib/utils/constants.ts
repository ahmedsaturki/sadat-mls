export const ROLES = {
  SUPER_ADMIN: "super_admin",
  OFFICE_ADMIN: "office_admin",
  OFFICE_AGENT: "office_agent",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "pending_review"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

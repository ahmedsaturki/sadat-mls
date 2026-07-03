export const ROLES = {
  SUPER_ADMIN: "super_admin",
  OFFICE_ADMIN: "office_admin",
  OFFICE_AGENT: "office_agent",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "pending_review"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

// ── Fine-grained permissions ──────────────────────────────────────────
export const PERMISSIONS = {
  // Office management
  OFFICE_VIEW: "office:view",
  OFFICE_CREATE: "office:create",
  OFFICE_UPDATE: "office:update",
  OFFICE_DELETE: "office:delete",
  OFFICE_DEACTIVATE: "office:deactivate",

  // User management
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_ROLE_CHANGE: "user:role_change",

  // Property management
  PROPERTY_VIEW: "property:view",
  PROPERTY_CREATE: "property:create",
  PROPERTY_UPDATE: "property:update",
  PROPERTY_DELETE: "property:delete",

  // Contact requests
  CONTACT_VIEW: "contact:view",
  CONTACT_UPDATE: "contact:update",
  CONTACT_DELETE: "contact:delete",

  // Zone management
  ZONE_VIEW: "zone:view",
  ZONE_CREATE: "zone:create",
  ZONE_UPDATE: "zone:update",
  ZONE_DELETE: "zone:delete",

  // Property types
  PROPERTY_TYPE_VIEW: "property_type:view",
  PROPERTY_TYPE_CREATE: "property_type:create",
  PROPERTY_TYPE_UPDATE: "property_type:update",
  PROPERTY_TYPE_DELETE: "property_type:delete",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_OFFICE_UPDATE: "settings:office_update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    // Full office management
    PERMISSIONS.OFFICE_VIEW, PERMISSIONS.OFFICE_CREATE, PERMISSIONS.OFFICE_UPDATE,
    PERMISSIONS.OFFICE_DELETE, PERMISSIONS.OFFICE_DEACTIVATE,
    // Full user management
    PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE, PERMISSIONS.USER_ROLE_CHANGE,
    // Full property management
    PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_UPDATE,
    PERMISSIONS.PROPERTY_DELETE,
    // Contact management
    PERMISSIONS.CONTACT_VIEW, PERMISSIONS.CONTACT_UPDATE, PERMISSIONS.CONTACT_DELETE,
    // Zone management
    PERMISSIONS.ZONE_VIEW, PERMISSIONS.ZONE_CREATE, PERMISSIONS.ZONE_UPDATE, PERMISSIONS.ZONE_DELETE,
    // Property types
    PERMISSIONS.PROPERTY_TYPE_VIEW, PERMISSIONS.PROPERTY_TYPE_CREATE,
    PERMISSIONS.PROPERTY_TYPE_UPDATE, PERMISSIONS.PROPERTY_TYPE_DELETE,
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    // Settings
    PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_OFFICE_UPDATE,
  ],
  [ROLES.OFFICE_ADMIN]: [
    // View-only offices
    PERMISSIONS.OFFICE_VIEW,
    // User management (agents only)
    PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_DELETE,
    // Property management
    PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_UPDATE,
    PERMISSIONS.PROPERTY_DELETE,
    // Contact management
    PERMISSIONS.CONTACT_VIEW, PERMISSIONS.CONTACT_UPDATE,
    // View-only zones
    PERMISSIONS.ZONE_VIEW,
    // View-only property types
    PERMISSIONS.PROPERTY_TYPE_VIEW,
    // Settings (own office only)
    PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_OFFICE_UPDATE,
  ],
  [ROLES.OFFICE_AGENT]: [
    // Property management (create + update + delete own)
    PERMISSIONS.PROPERTY_VIEW, PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_UPDATE,
    PERMISSIONS.PROPERTY_DELETE,
    // Contact management (view only)
    PERMISSIONS.CONTACT_VIEW,
    // View-only zones
    PERMISSIONS.ZONE_VIEW,
    // View-only property types
    PERMISSIONS.PROPERTY_TYPE_VIEW,
    // Settings (profile only)
    PERMISSIONS.SETTINGS_VIEW,
  ],
} as const;

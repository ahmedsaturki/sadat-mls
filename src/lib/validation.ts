import { z } from "zod";
import { PROPERTY_STATUSES } from "@/lib/utils/constants";

// Shared password validation regex (uppercase, lowercase, number, special character, min 8 chars)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const agentSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }).max(128, {
    message: "Password cannot exceed 128 characters",
  }).regex(PASSWORD_REGEX, {
    message: "Password must include uppercase, lowercase, number, and special character",
  }),
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).max(100, {
    message: "Name cannot exceed 100 characters",
  }),
  role: z.enum(["office_agent", "office_admin"], {
    message: "Role must be either office_agent or office_admin",
  }),
  officeId: z.string().uuid({
    message: "Invalid office ID",
  }),
  phone: z.string().optional(),
});

const optionalUuidString = (message: string) =>
  z.string().refine(
    (value) => value === "" || z.string().uuid().safeParse(value).success,
    { message },
  );

const positiveNumberString = (message: string) =>
  z.string().trim().refine(
    (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0,
    { message },
  );

const optionalNonNegativeIntegerString = (message: string) =>
  z.string().trim().refine(
    (value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 0),
    { message },
  );

const optionalEmailString = (message: string) =>
  z.string().trim().refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    { message },
  ).optional();

export const propertySchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }).max(200, {
    message: "Title cannot exceed 200 characters",
  }),
  description: z.string().optional(),
  price: positiveNumberString("Price must be positive"),
  property_type_id: optionalUuidString("Invalid property type ID"),
  zone_id: optionalUuidString("Invalid zone ID"),
  bedrooms: optionalNonNegativeIntegerString("Bedrooms must be at least 0").optional(),
  bathrooms: optionalNonNegativeIntegerString("Bathrooms must be at least 0").optional(),
  floors: optionalNonNegativeIntegerString("Floors must be at least 0").optional(),
  area: positiveNumberString("Area must be positive"),
  street: z.string().optional(),
  status: z.enum(PROPERTY_STATUSES, {
    message: "Invalid status",
  }),
});

export const ownerSchema = z.object({
  owner_name: z.string(),
  owner_email: z.string(),
  owner_phone: z.string(),
  notes: z.string().optional(),
}).superRefine((owner, ctx) => {
  const hasOwnerData = Boolean(
    owner.owner_name.trim() ||
    owner.owner_phone.trim() ||
    owner.owner_email.trim() ||
    owner.notes?.trim(),
  );

  if (!hasOwnerData) {
    return;
  }

  if (owner.owner_name.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["owner_name"],
      message: "Name must be at least 2 characters",
    });
  }

  if (owner.owner_name.trim().length > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["owner_name"],
      message: "Name cannot exceed 100 characters",
    });
  }

  if (owner.owner_phone.trim().length < 10 || owner.owner_phone.trim().length > 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["owner_phone"],
      message: "Phone must be between 10 and 20 characters",
    });
  }

  if (owner.owner_email.trim() && !z.string().email().safeParse(owner.owner_email.trim()).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["owner_email"],
      message: "Please enter a valid email address",
    });
  }
});

export const officeSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).max(100, {
    message: "Name cannot exceed 100 characters",
  }),
  slug: z.string().trim().refine(
    (value) => value === "" || /^[a-z0-9-]+$/.test(value),
    { message: "Slug can only contain lowercase letters, numbers, and hyphens" },
  ).optional(),
  email: optionalEmailString("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url({
    message: "Invalid logo URL",
  }).optional(),
});

export const authSchemas = {
  login: z.object({
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    password: z.string().min(1, {
      message: "Password is required",
    }),
    rememberMe: z.boolean().default(false),
  }),

  register: z.object({
    fullName: z.string().min(2, {
      message: "Name must be at least 2 characters",
    }).max(100, {
      message: "Name cannot exceed 100 characters",
    }),
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }).max(128, {
      message: "Password cannot exceed 128 characters",
    }).regex(PASSWORD_REGEX, {
      message: "Password must include uppercase, lowercase, number, and special character",
    }),
    officeId: z.string().uuid().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  }),

  forgotPassword: z.object({
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
  }),

  resetPassword: z.object({
    token: z.string().min(1, {
      message: "Reset token is required",
    }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters",
    }).max(128, {
      message: "Password cannot exceed 128 characters",
    }).regex(PASSWORD_REGEX, {
      message: "Password must include uppercase, lowercase, number, and special character",
    }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),

  verifyEmail: z.object({
    token: z.string().min(1, {
      message: "Verification token is required",
    }),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, {
      message: "Current password is required",
    }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters",
    }).max(128, {
      message: "Password cannot exceed 128 characters",
    }).regex(PASSWORD_REGEX, {
      message: "Password must include uppercase, lowercase, number, and special character",
    }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
};

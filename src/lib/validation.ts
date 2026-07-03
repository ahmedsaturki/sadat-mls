import { z } from "zod";

export const agentSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }).max(128, {
    message: "Password cannot exceed 128 characters",
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
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

export const propertySchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }).max(200, {
    message: "Title cannot exceed 200 characters",
  }),
  description: z.string().optional(),
  price: z.number().positive({
    message: "Price must be positive",
  }),
  propertyTypeId: z.string().uuid({
    message: "Invalid property type ID",
  }),
  zoneId: z.string().uuid({
    message: "Invalid zone ID",
  }),
  bedrooms: z.number().int().min(0, {
    message: "Bedrooms must be at least 0",
  }).optional(),
  bathrooms: z.number().int().min(0, {
    message: "Bathrooms must be at least 0",
  }).optional(),
  area: z.number().positive({
    message: "Area must be positive",
  }).optional(),
  address: z.string().optional(),
  status: z.enum(["active", "pending", "sold", "rented", "inactive"], {
    message: "Invalid status",
  }),
});

export const ownerSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).max(100, {
    message: "Name cannot exceed 100 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }).optional(),
  phone: z.string().min(10, {
    message: "Phone must be at least 10 characters",
  }).max(20, {
    message: "Phone cannot exceed 20 characters",
  }).optional(),
  address: z.string().optional(),
});

export const officeSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).max(100, {
    message: "Name cannot exceed 100 characters",
  }),
  slug: z.string().min(2, {
    message: "Slug must be at least 2 characters",
  }).max(100, {
    message: "Slug cannot exceed 100 characters",
  }).regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }).optional(),
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
    }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/, {
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
    }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/, {
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
    }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/, {
      message: "Password must include uppercase, lowercase, number, and special character",
    }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
};
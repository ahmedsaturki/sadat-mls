import { z } from "zod";

export const propertySchema = z.object({
  title: z
    .string()
    .min(3)
    .max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  property_type_id: z.string().uuid().optional().or(z.literal("")),
  zone_id: z.string().uuid().optional().or(z.literal("")),
  street: z.string().max(200).optional().or(z.literal("")),
  price: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0)
    .refine((val) => Number(val) <= 999999999),
  area: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  bedrooms: z
    .string()
    .min(1)
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 20
    ),
  bathrooms: z
    .string()
    .min(1)
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10
    ),
  floors: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100)
    ),
  has_balcony: z.boolean().default(false),
  has_parking: z.boolean().default(false),
  has_elevator: z.boolean().default(false),
  status: z.enum(["available", "reserved", "sold", "rented", "pending_review"]).default("available"),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const ownerSchema = z.object({
  owner_name: z.string().max(100).optional().or(z.literal("")),
  owner_phone: z
    .string()
    .min(10)
    .refine((val) => /^0[0-9]{9,10}$/.test(val)),
  owner_email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    ),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;

export const officeSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^0[0-9]{9,10}$/.test(val)
    ),
  address: z.string().max(300).optional().or(z.literal("")),
});

export type OfficeFormData = z.infer<typeof officeSchema>;

export const agentSchema = z.object({
  full_name: z
    .string()
    .min(2)
    .max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^0[0-9]{9,10}$/.test(val)
    ),
});

export type AgentFormData = z.infer<typeof agentSchema>;

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .min(10)
    .refine((val) => /^0[0-9]{9,10}$/.test(val)),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormData = z.infer<typeof loginSchema>;

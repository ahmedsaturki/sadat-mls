import { describe, expect, it } from "vitest";
import { authSchemas, officeSchema, ownerSchema, propertySchema, agentSchema } from "@/lib/validation";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("propertySchema", () => {
  const validProperty = {
    title: "Apartment in District 1",
    description: "Sunny apartment",
    property_type_id: "",
    zone_id: "",
    street: "Main street",
    price: "1500000",
    area: "120",
    bedrooms: "3",
    bathrooms: "2",
    floors: "4",
    status: "available",
  };

  it("accepts valid property data", () => {
    expect(propertySchema.safeParse(validProperty).success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = ["available", "reserved", "sold", "rented", "pending_review"];
    for (const status of statuses) {
      expect(propertySchema.safeParse({ ...validProperty, status }).success).toBe(true);
    }
  });

  it("rejects obsolete status 'active'", () => {
    expect(propertySchema.safeParse({ ...validProperty, status: "active" }).success).toBe(false);
  });

  it("rejects empty title", () => {
    expect(propertySchema.safeParse({ ...validProperty, title: "" }).success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    expect(propertySchema.safeParse({ ...validProperty, title: "x".repeat(201) }).success).toBe(false);
  });

  it("accepts title exactly 200 chars", () => {
    expect(propertySchema.safeParse({ ...validProperty, title: "x".repeat(200) }).success).toBe(true);
  });

  it("rejects price of zero", () => {
    expect(propertySchema.safeParse({ ...validProperty, price: "0" }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(propertySchema.safeParse({ ...validProperty, price: "-1000" }).success).toBe(false);
  });

  it("rejects non-numeric price", () => {
    expect(propertySchema.safeParse({ ...validProperty, price: "abc" }).success).toBe(false);
  });

  it("rejects empty price", () => {
    expect(propertySchema.safeParse({ ...validProperty, price: "" }).success).toBe(false);
  });

  it("rejects area of zero", () => {
    expect(propertySchema.safeParse({ ...validProperty, area: "0" }).success).toBe(false);
  });

  it("rejects negative area", () => {
    expect(propertySchema.safeParse({ ...validProperty, area: "-50" }).success).toBe(false);
  });

  it("rejects non-numeric area", () => {
    expect(propertySchema.safeParse({ ...validProperty, area: "abc" }).success).toBe(false);
  });

  it("accepts valid UUIDs for property_type_id", () => {
    expect(propertySchema.safeParse({ ...validProperty, property_type_id: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid property_type_id", () => {
    expect(propertySchema.safeParse({ ...validProperty, property_type_id: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts valid UUIDs for zone_id", () => {
    expect(propertySchema.safeParse({ ...validProperty, zone_id: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid zone_id", () => {
    expect(propertySchema.safeParse({ ...validProperty, zone_id: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts zero bedrooms", () => {
    expect(propertySchema.safeParse({ ...validProperty, bedrooms: "0" }).success).toBe(true);
  });

  it("rejects negative bedrooms", () => {
    expect(propertySchema.safeParse({ ...validProperty, bedrooms: "-1" }).success).toBe(false);
  });

  it("rejects non-integer bedrooms", () => {
    expect(propertySchema.safeParse({ ...validProperty, bedrooms: "1.5" }).success).toBe(false);
  });

  it("accepts zero bathrooms", () => {
    expect(propertySchema.safeParse({ ...validProperty, bathrooms: "0" }).success).toBe(true);
  });

  it("rejects negative bathrooms", () => {
    expect(propertySchema.safeParse({ ...validProperty, bathrooms: "-1" }).success).toBe(false);
  });

  it("makes optional fields actually optional", () => {
    const minimal = {
      title: "Studio",
      price: "500000",
      area: "50",
      property_type_id: "",
      zone_id: "",
      status: "available",
    };
    expect(propertySchema.safeParse(minimal).success).toBe(true);
  });

  it("accepts empty optional UUID fields", () => {
    expect(propertySchema.safeParse({
      ...validProperty,
      property_type_id: "",
      zone_id: "",
    }).success).toBe(true);
  });
});

describe("ownerSchema", () => {
  it("allows completely empty owner data", () => {
    expect(ownerSchema.safeParse({
      owner_name: "",
      owner_phone: "",
      owner_email: "",
      notes: "",
    }).success).toBe(true);
  });

  it("accepts valid owner data", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed Hassan",
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
    }).success).toBe(true);
  });

  it("rejects name shorter than 2 chars when data provided", () => {
    expect(ownerSchema.safeParse({
      owner_name: "A",
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
    }).success).toBe(false);
  });

  it("accepts name of exactly 2 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ah",
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
    }).success).toBe(true);
  });

  it("accepts name of exactly 100 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "A".repeat(100),
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
    }).success).toBe(true);
  });

  it("rejects name over 100 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "A".repeat(101),
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
    }).success).toBe(false);
  });

  it("rejects phone shorter than 10 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "123456789",
      owner_email: "ahmed@example.com",
    }).success).toBe(false);
  });

  it("accepts phone of exactly 10 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "0101234567",
      owner_email: "ahmed@example.com",
    }).success).toBe(true);
  });

  it("accepts phone of exactly 20 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "0".repeat(20),
      owner_email: "ahmed@example.com",
    }).success).toBe(true);
  });

  it("rejects phone over 20 chars", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "0".repeat(21),
      owner_email: "ahmed@example.com",
    }).success).toBe(false);
  });

  it("rejects invalid email when data provided", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "01012345678",
      owner_email: "not-email",
    }).success).toBe(false);
  });

  it("allows empty email with valid name/phone", () => {
    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "01012345678",
      owner_email: "",
    }).success).toBe(true);
  });

  it("validates only when owner has data", () => {
    expect(ownerSchema.safeParse({
      owner_name: "",
      owner_phone: "",
      owner_email: "",
    }).success).toBe(true);
  });
});

describe("agentSchema", () => {
  const validAgent = {
    email: "agent@example.com",
    password: "Password1!",
    fullName: "Ahmed Hassan",
    role: "office_agent" as const,
    officeId: VALID_UUID,
  };

  it("accepts valid agent data", () => {
    expect(agentSchema.safeParse(validAgent).success).toBe(true);
  });

  it("accepts office_admin role", () => {
    expect(agentSchema.safeParse({ ...validAgent, role: "office_admin" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(agentSchema.safeParse({ ...validAgent, email: "not-email" }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(agentSchema.safeParse({ ...validAgent, password: "Ab1!" }).success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    expect(agentSchema.safeParse({ ...validAgent, password: "password1!" }).success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    expect(agentSchema.safeParse({ ...validAgent, password: "PASSWORD1!" }).success).toBe(false);
  });

  it("rejects password without digit", () => {
    expect(agentSchema.safeParse({ ...validAgent, password: "Password!" }).success).toBe(false);
  });

  it("rejects password without special char", () => {
    expect(agentSchema.safeParse({ ...validAgent, password: "Password1" }).success).toBe(false);
  });

  it("rejects short fullName", () => {
    expect(agentSchema.safeParse({ ...validAgent, fullName: "A" }).success).toBe(false);
  });

  it("rejects fullName over 100 chars", () => {
    expect(agentSchema.safeParse({ ...validAgent, fullName: "A".repeat(101) }).success).toBe(false);
  });

  it("rejects invalid role", () => {
    expect(agentSchema.safeParse({ ...validAgent, role: "super_admin" }).success).toBe(false);
  });

  it("rejects invalid officeId", () => {
    expect(agentSchema.safeParse({ ...validAgent, officeId: "not-a-uuid" }).success).toBe(false);
  });

  it("allows optional phone", () => {
    expect(agentSchema.safeParse({ ...validAgent, phone: "01012345678" }).success).toBe(true);
  });
});

describe("authSchemas.login", () => {
  it("accepts valid credentials", () => {
    expect(authSchemas.login.safeParse({
      email: "test@example.com",
      password: "password123",
    }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(authSchemas.login.safeParse({
      email: "not-email",
      password: "password123",
    }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(authSchemas.login.safeParse({
      email: "test@example.com",
      password: "",
    }).success).toBe(false);
  });

  it("defaults rememberMe to false", () => {
    const result = authSchemas.login.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });
});

describe("authSchemas.register", () => {
  const validRegister = {
    fullName: "Ahmed Hassan",
    email: "ahmed@example.com",
    password: "Password1!",
    termsAccepted: true,
  };

  it("accepts valid registration data", () => {
    expect(authSchemas.register.safeParse(validRegister).success).toBe(true);
  });

  it("rejects short fullName", () => {
    expect(authSchemas.register.safeParse({ ...validRegister, fullName: "A" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(authSchemas.register.safeParse({ ...validRegister, email: "bad" }).success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    expect(authSchemas.register.safeParse({ ...validRegister, password: "Ab1!X" }).success).toBe(false);
  });

  it("rejects termsAccepted: false", () => {
    expect(authSchemas.register.safeParse({ ...validRegister, termsAccepted: false }).success).toBe(false);
  });

  it("accepts optional officeId as valid UUID", () => {
    expect(authSchemas.register.safeParse({
      ...validRegister,
      officeId: VALID_UUID,
    }).success).toBe(true);
  });

  it("rejects invalid officeId", () => {
    expect(authSchemas.register.safeParse({
      ...validRegister,
      officeId: "not-a-uuid",
    }).success).toBe(false);
  });
});

describe("authSchemas.forgotPassword", () => {
  it("accepts valid email", () => {
    expect(authSchemas.forgotPassword.safeParse({ email: "test@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(authSchemas.forgotPassword.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("authSchemas.resetPassword", () => {
  const validReset = {
    token: "abc123",
    newPassword: "NewPass1!",
    confirmPassword: "NewPass1!",
  };

  it("accepts valid reset data", () => {
    expect(authSchemas.resetPassword.safeParse(validReset).success).toBe(true);
  });

  it("rejects empty token", () => {
    expect(authSchemas.resetPassword.safeParse({ ...validReset, token: "" }).success).toBe(false);
  });

  it("rejects passwords that don't match", () => {
    expect(authSchemas.resetPassword.safeParse({
      ...validReset,
      confirmPassword: "Different1!",
    }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(authSchemas.resetPassword.safeParse({
      ...validReset,
      newPassword: "Ab1!",
      confirmPassword: "Ab1!",
    }).success).toBe(false);
  });
});

describe("authSchemas.verifyEmail", () => {
  it("accepts valid token", () => {
    expect(authSchemas.verifyEmail.safeParse({ token: "abc123" }).success).toBe(true);
  });

  it("rejects empty token", () => {
    expect(authSchemas.verifyEmail.safeParse({ token: "" }).success).toBe(false);
  });
});

describe("authSchemas.changePassword", () => {
  const validChange = {
    currentPassword: "OldPass1!",
    newPassword: "NewPass1!",
    confirmPassword: "NewPass1!",
  };

  it("accepts valid change password data", () => {
    expect(authSchemas.changePassword.safeParse(validChange).success).toBe(true);
  });

  it("rejects empty current password", () => {
    expect(authSchemas.changePassword.safeParse({
      ...validChange,
      currentPassword: "",
    }).success).toBe(false);
  });

  it("rejects passwords that don't match", () => {
    expect(authSchemas.changePassword.safeParse({
      ...validChange,
      confirmPassword: "Different1!",
    }).success).toBe(false);
  });

  it("rejects short new password", () => {
    expect(authSchemas.changePassword.safeParse({
      ...validChange,
      newPassword: "Ab1!",
      confirmPassword: "Ab1!",
    }).success).toBe(false);
  });
});

describe("officeSchema", () => {
  it("accepts valid office data", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      slug: "sadat-office",
      email: "office@example.com",
      phone: "01012345678",
      address: "123 Main St",
    }).success).toBe(true);
  });

  it("accepts empty slug", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      slug: "",
    }).success).toBe(true);
  });

  it("rejects slug with special characters", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      slug: "sadat office!",
    }).success).toBe(false);
  });

  it("accepts slug with hyphens and numbers", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      slug: "sadat-office-123",
    }).success).toBe(true);
  });

  it("rejects short name", () => {
    expect(officeSchema.safeParse({
      name: "A",
    }).success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(officeSchema.safeParse({
      name: "A".repeat(101),
    }).success).toBe(false);
  });

  it("rejects invalid logo URL", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      logoUrl: "not-a-url",
    }).success).toBe(false);
  });

  it("accepts valid logo URL", () => {
    expect(officeSchema.safeParse({
      name: "Sadat Office",
      logoUrl: "https://example.com/logo.png",
    }).success).toBe(true);
  });
});

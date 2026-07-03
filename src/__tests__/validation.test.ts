import { describe, expect, it } from "vitest";
import { authSchemas, officeSchema, ownerSchema, propertySchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts property form data in the same shape the UI submits", () => {
    const result = propertySchema.safeParse({
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
    });

    expect(result.success).toBe(true);
  });

  it("rejects obsolete property statuses", () => {
    const result = propertySchema.safeParse({
      title: "Apartment in District 1",
      property_type_id: "",
      zone_id: "",
      price: "1500000",
      area: "120",
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("allows empty owner info but validates partially entered owner info", () => {
    expect(ownerSchema.safeParse({
      owner_name: "",
      owner_phone: "",
      owner_email: "",
      notes: "",
    }).success).toBe(true);

    expect(ownerSchema.safeParse({
      owner_name: "Ahmed",
      owner_phone: "01012345678",
      owner_email: "ahmed@example.com",
      notes: "",
    }).success).toBe(true);

    expect(ownerSchema.safeParse({
      owner_name: "A",
      owner_phone: "123",
      owner_email: "not-email",
      notes: "needs validation",
    }).success).toBe(false);
  });

  it("accepts valid password rules in auth schemas", () => {
    const result = authSchemas.register.safeParse({
      fullName: "Ahmed Hassan",
      email: "ahmed@example.com",
      password: "Password1!",
      termsAccepted: true,
    });

    expect(result.success).toBe(true);
  });

  it("accepts office creation data with an empty generated slug", () => {
    const result = officeSchema.safeParse({
      name: "Sadat Office",
      slug: "",
      email: "",
      phone: "",
      address: "",
    });

    expect(result.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";

describe("Auth Utilities", () => {
  it("should validate UUID format", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const invalidUuid = "invalid-uuid";
    
    expect(uuidRegex.test(validUuid)).toBe(true);
    expect(uuidRegex.test(invalidUuid)).toBe(false);
  });

  it("should have sanitize function available", async () => {
    const { sanitize } = await import("@/lib/security/sanitize");
    expect(typeof sanitize).toBe("function");
  });

  it("should have rateLimit function available", async () => {
    const { checkApiRateLimit } = await import("@/lib/security/rateLimit");
    expect(typeof checkApiRateLimit).toBe("function");
  });
});
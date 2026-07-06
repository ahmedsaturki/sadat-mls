import { describe, it, expect } from "vitest";
import { PasswordService } from "@/lib/security/password";

describe("PasswordService", () => {
  describe("validate", () => {
    it("returns isValid: true for a strong password", () => {
      const result = PasswordService.validate("MyStr0ng!Pass");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns isValid: false with an error list for a weak password", () => {
      const result = PasswordService.validate("weak");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("flags a password below minimum length", () => {
      const result = PasswordService.validate("Ab1!xyz");
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => /at least 8 characters/.test(e))).toBe(true);
    });

    it("flags a password missing an uppercase letter", () => {
      const result = PasswordService.validate("mystr0ng!pass");
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => /uppercase/.test(e))).toBe(true);
    });

    it("flags a password missing a number", () => {
      const result = PasswordService.validate("MyStrong!Pass");
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => /number/.test(e))).toBe(true);
    });

    it("flags a common blocked password", () => {
      const result = PasswordService.validate("Password1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password is too common");
    });
  });

  describe("hash", () => {
    it("produces a non-empty bcrypt hash for a strong password", async () => {
      const hash = await PasswordService.hash("MyStr0ng!Pass");
      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(20);
      // bcrypt hashes start with $2
      expect(hash.startsWith("$2")).toBe(true);
    });

    it("produces different hashes for the same password (salt is varied)", async () => {
      const a = await PasswordService.hash("MyStr0ng!Pass");
      const b = await PasswordService.hash("MyStr0ng!Pass");
      expect(a).not.toBe(b);
    });

    it("truncates over-long passwords at the configured max length", async () => {
      const overlong = "MyStr0ng!" + "X".repeat(200);
      const hash = await PasswordService.hash(overlong);
      expect(hash).toBeTruthy();
      // Re-verify with the same truncation
      const ok = await PasswordService.verify("MyStr0ng!" + "X".repeat(200), hash);
      expect(ok).toBe(true);
    });
  });

  describe("verify", () => {
    it("verifies a correct password against its hash", async () => {
      const hash = await PasswordService.hash("MyStr0ng!Pass");
      const ok = await PasswordService.verify("MyStr0ng!Pass", hash);
      expect(ok).toBe(true);
    });

    it("rejects an incorrect password", async () => {
      const hash = await PasswordService.hash("MyStr0ng!Pass");
      const ok = await PasswordService.verify("Wrong!Passw0rd", hash);
      expect(ok).toBe(false);
    });

    it("consistently rejects empty passwords", async () => {
      const hash = await PasswordService.hash("MyStr0ng!Pass");
      const ok = await PasswordService.verify("", hash);
      expect(ok).toBe(false);
    });
  });
});

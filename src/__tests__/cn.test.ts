import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });

  it("handles empty string", () => {
    const result = cn("");
    expect(result).toBe("");
  });

  it("handles no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("deduplicates tailwind conflicting classes", () => {
    const result = cn("p-2 p-4");
    expect(result).toBe("p-4");
  });

  it("merges non-conflicting tailwind classes", () => {
    const result = cn("text-red-500", "bg-blue-500", "rounded-lg");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
    expect(result).toContain("rounded-lg");
  });

  it("handles array inputs", () => {
    const result = cn(["text-sm", "font-bold"], "text-gray-900");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
    expect(result).toContain("text-gray-900");
  });

  it("handles object inputs", () => {
    const result = cn({ "text-red-500": true, "text-blue-500": false, "font-bold": true });
    expect(result).toContain("text-red-500");
    expect(result).toContain("font-bold");
    expect(result).not.toContain("text-blue-500");
  });

  it("handles mixed array, object, and string inputs", () => {
    const result = cn("base", ["conditional", { active: true, disabled: false }]);
    expect(result).toContain("base");
    expect(result).toContain("conditional");
    expect(result).toContain("active");
    expect(result).not.toContain("disabled");
  });

  it("strips falsy values (0, empty string, NaN)", () => {
    const result = cn("base", 0, "", NaN, false, null, undefined, "extra");
    expect(result).not.toContain("0");
    expect(result).toContain("base");
    expect(result).toContain("extra");
  });

  it("resolves tailwind class conflicts across inputs", () => {
    const result = cn("text-red-500", "text-blue-500", "text-green-500");
    expect(result).toBe("text-green-500");
  });

  it("preserves responsive variants without conflict", () => {
    const result = cn("p-2 md:p-4 lg:p-6");
    expect(result).toContain("p-2");
    expect(result).toContain("md:p-4");
    expect(result).toContain("lg:p-6");
  });
});

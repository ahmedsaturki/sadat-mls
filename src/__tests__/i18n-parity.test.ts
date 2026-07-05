import { describe, it, expect } from "vitest";
import ar from "@/i18n/messages/ar.json";
import en from "@/i18n/messages/en.json";

type Dict = Record<string, unknown>;

function flattenKeys(obj: Dict, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Dict, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("i18n translation parity", () => {
  it("ar.json is a valid JSON object", () => {
    expect(typeof ar).toBe("object");
  });

  it("en.json is a valid JSON object", () => {
    expect(typeof en).toBe("object");
  });

  it("both files share the same set of leaf keys (parity)", () => {
    const arKeys = flattenKeys(ar as Dict);
    const enKeys = flattenKeys(en as Dict);
    expect(arKeys).toEqual(enKeys);
  });

  it("ar.json has more than 50 keys (minimum reasonable surface)", () => {
    const arKeys = flattenKeys(ar as Dict);
    expect(arKeys.length).toBeGreaterThan(50);
  });

  it("none of the known nav keys are missing", () => {
    expect((ar as Dict).nav).toBeDefined();
    expect((en as Dict).nav).toBeDefined();
    expect(((ar as Dict).nav as Dict).notifications).toBeDefined();
    expect(((en as Dict).nav as Dict).notifications).toBeDefined();
    expect(((ar as Dict).nav as Dict).markAllRead).toBeDefined();
    expect(((en as Dict).nav as Dict).markAllRead).toBeDefined();
  });

  it("timeAgo exists under common in both locales", () => {
    expect(((ar as Dict).common as Dict).timeAgo).toBeDefined();
    expect(((en as Dict).common as Dict).timeAgo).toBeDefined();
    const arTime = ((ar as Dict).common as Dict).timeAgo as Dict;
    const enTime = ((en as Dict).common as Dict).timeAgo as Dict;
    expect(arTime.justNow).toBeDefined();
    expect(arTime.minutesAgo).toBeDefined();
    expect(arTime.hoursAgo).toBeDefined();
    expect(arTime.daysAgo).toBeDefined();
    expect(enTime.justNow).toBeDefined();
    expect(enTime.minutesAgo).toBeDefined();
    expect(enTime.hoursAgo).toBeDefined();
    expect(enTime.daysAgo).toBeDefined();
  });

  it("Arabic timeAgo minutesAgo includes {{count}} token (ICU-style count)", () => {
    const arTime = ((ar as Dict).common as Dict).timeAgo as Dict;
    expect(arTime.minutesAgo).toMatch(/\{\{count\}\}/);
  });

  it("English timeAgo minutesAgo includes {{count}} token", () => {
    const enTime = ((en as Dict).common as Dict).timeAgo as Dict;
    expect(enTime.minutesAgo).toMatch(/\{\{count\}\}/);
  });

  it("no leaf string is the empty string (no unfilled placeholders)", () => {
    const arKeys = flattenKeys(ar as Dict);
    const violations: string[] = [];
    for (const key of arKeys) {
      const parts = key.split(".");
      let cursor: unknown = ar;
      for (const p of parts) {
        if (cursor && typeof cursor === "object") {
          cursor = (cursor as Dict)[p];
        }
      }
      if (cursor === "") {
        violations.push(key);
      }
    }
    expect(violations).toEqual([]);
  });
});

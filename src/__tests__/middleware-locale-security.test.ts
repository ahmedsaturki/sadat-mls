import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getLocale } from "../../middleware";

function request(pathname: string, acceptLanguage?: string) {
  const headers = acceptLanguage ? { "accept-language": acceptLanguage } : undefined;
  return new NextRequest(`http://localhost${pathname}`, { headers });
}

describe("middleware locale security regression", () => {
  it("preserves an explicit Arabic path even when the browser prefers English", () => {
    expect(getLocale(request("/ar/dashboard/favorites", "en-US,en;q=0.9"))).toBe("ar");
  });

  it("preserves an explicit English path even when the browser prefers Arabic", () => {
    expect(getLocale(request("/en/dashboard/favorites", "ar-EG,ar;q=0.9"))).toBe("en");
  });

  it("uses Accept-Language when the path has no explicit locale", () => {
    expect(getLocale(request("/dashboard/favorites", "en-US,en;q=0.9"))).toBe("en");
    expect(getLocale(request("/dashboard/favorites", "ar-EG,ar;q=0.9"))).toBe("ar");
  });

  it("falls back to Arabic for unsupported browser languages", () => {
    expect(getLocale(request("/dashboard/favorites", "fr-FR,fr;q=0.9"))).toBe("ar");
  });
});

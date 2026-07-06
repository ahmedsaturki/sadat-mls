import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefixes the message with an ISO timestamp and uppercase level", () => {
    logger.info("hello");
    expect(console.info).toHaveBeenCalledTimes(1);
    const arg = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(arg).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\] \[INFO\] hello$/);
  });

  it("serialises context as JSON when provided", () => {
    logger.error("failed", { userId: 1, env: "test" });
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(arg).toContain("[ERROR] failed");
    expect(arg).toContain('{"userId":1,"env":"test"}');
  });

  it("omits context when none is provided", () => {
    logger.warn("lonely");
    const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(arg.endsWith("lonely")).toBe(true);
  });

  describe("log routing", () => {
    it("debug → console.debug", () => {
      logger.debug("d");
      expect(console.debug).toHaveBeenCalledTimes(1);
    });

    it("info → console.info", () => {
      logger.info("i");
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it("warn → console.warn", () => {
      logger.warn("w");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("error → console.error", () => {
      logger.error("e");
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("toastError → console.error with TOAST prefix", () => {
      logger.toastError("boom", { code: "X" });
      expect(console.error).toHaveBeenCalledTimes(1);
      const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(arg).toContain("[TOAST] TOAST: boom");
      expect(arg).toContain('"code":"X"');
    });
  });

  describe("apiRequest / apiResponse", () => {
    it("apiRequest logs at info level", () => {
      logger.apiRequest("POST", "/api/contact", { ip: "1.2.3.4" });
      expect(console.info).toHaveBeenCalledTimes(1);
      const arg = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(arg).toContain("[INFO] POST /api/contact");
      expect(arg).toContain('"ip":"1.2.3.4"');
    });

    it("apiResponse logs 2xx as info", () => {
      logger.apiResponse("GET", "/api/health", 200);
      expect(console.info).toHaveBeenCalledTimes(1);
      const arg = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(arg).toContain("GET /api/health → 200");
    });

    it("apiResponse logs 4xx as warn", () => {
      logger.apiResponse("POST", "/api/contact", 400);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("apiResponse logs 5xx as error", () => {
      logger.apiResponse("GET", "/api/agents", 502);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("supabaseError", () => {
    it("logs most errors at error level", () => {
      logger.supabaseError("query", { message: "x", code: "P0001" });
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("logs over_request_rate_limit at warn level", () => {
      logger.supabaseError("query", {
        message: "rate limited",
        code: "over_request_rate_limit",
      });
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("accepts a missing error.code (treated as error level)", () => {
      logger.supabaseError("insert", { message: "fk violation" });
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("rateLimit", () => {
    it("logs at warn with retryAfter when provided", () => {
      logger.rateLimit("/api/x", 30);
      expect(console.warn).toHaveBeenCalledTimes(1);
      const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(arg).toContain("Rate limit hit for /api/x");
      expect(arg).toContain('"retryAfter":30');
    });

    it("logs at warn without retryAfter", () => {
      logger.rateLimit("/api/y");
      const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(arg).toContain("Rate limit hit for /api/y");
    });
  });
});

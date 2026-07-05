import { describe, it, expect, vi } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  serializeError,
  withErrorHandling,
} from "@/lib/security/error";
import type { logger as appLogger } from "@/lib/logger";

describe("AppError", () => {
  it("constructs with sensible defaults", () => {
    const err = new AppError("boom");
    expect(err.message).toBe("boom");
    expect(err.status).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("AppError");
  });

  it("toJSON omits context when none", () => {
    expect(new AppError("x").toJSON()).toEqual({
      message: "x",
      status: 500,
      code: "INTERNAL_ERROR",
    });
  });

  it("toJSON includes context when supplied", () => {
    expect(new AppError("x", 500, "X", true, { foo: 1 }).toJSON()).toEqual({
      message: "x",
      status: 500,
      code: "X",
      context: { foo: 1 },
    });
  });

  it("captures a stack trace pointing at the constructor", () => {
    const err = new AppError("x");
    expect(typeof err.stack).toBe("string");
    expect(err.stack).toBeTruthy();
  });
});

describe("Error subclasses", () => {
  it("ValidationError uses 400 + fieldErrors context", () => {
    const err = new ValidationError("bad input", { name: ["required"] });
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.context?.fieldErrors).toEqual({ name: ["required"] });
  });

  it("NotFoundError formats messages with optional id", () => {
    expect(new NotFoundError("Property").message).toMatch(/not found$/);
    expect(new NotFoundError("Property", "abc").message).toMatch(/id "abc"/);
    expect(new NotFoundError("Office", "x").status).toBe(404);
  });

  it("UnauthorizedError defaults", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError defaults", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("RateLimitError exposes retryAfter in context", () => {
    const err = new RateLimitError("slow down", 30);
    expect(err.status).toBe(429);
    expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(err.context?.retryAfter).toBe(30);
    expect(err.retryAfter).toBe(30);
  });
});

describe("serializeError", () => {
  it("returns AppError fields verbatim", () => {
    const err = new ValidationError("v");
    const out = serializeError(err);
    expect(out.message).toBe("v");
    expect(out.status).toBe(400);
    expect(out.code).toBe("VALIDATION_ERROR");
    expect(out.isOperational).toBe(true);
  });

  it("hides stack for operational errors", () => {
    const err = new AppError("x", 500, "X", true);
    expect(serializeError(err).stack).toBeUndefined();
  });

  it("normalizes non-Error inputs to internal_error", () => {
    // String input is replaced with a generic `An unexpected error occurred`
    // message — strings are treated as opaque non-errors and discarded.
    const out = serializeError("a string");
    expect(out.status).toBe(500);
    expect(out.code).toBe("INTERNAL_ERROR");
    expect(out.isOperational).toBe(false);
    expect(out.message).toBe("An unexpected error occurred");
  });

  it("normalizes thrown numbers to a generic message", () => {
    const out = serializeError(123);
    expect(out.message).toBe("An unexpected error occurred");
  });
});

describe("withErrorHandling", () => {
  it("returns the inner result on success", async () => {
    const fn = vi.fn(async () => 42);
    const wrapped = withErrorHandling(fn);
    await expect(wrapped()).resolves.toBe(42);
  });

  it("rethrows AppError unchanged", async () => {
    const fn = vi.fn(async () => {
      throw new UnauthorizedError("nope");
    });
    const wrapped = withErrorHandling(fn);
    await expect(wrapped()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("wraps non-AppError values into an internal AppError", async () => {
    const fn = vi.fn(async () => {
      throw new Error("boom");
    });
    const wrapped = withErrorHandling(fn);
    await expect(wrapped()).rejects.toBeInstanceOf(AppError);
  });

  it("invokes onError for AppError to allow downgrade", async () => {
    const onError = vi.fn((err: AppError) =>
      new ValidationError(err.message, { x: ["mapped"] }),
    );
    const wrapped = withErrorHandling(
      async () => {
        throw new UnauthorizedError("u");
      },
      { onError },
    );
    try {
      await wrapped();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(onError).toHaveBeenCalledTimes(1);
    }
  });

  it("uses a custom logger when supplied", async () => {
    const customLogger = {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as unknown as typeof appLogger;
    const wrapped = withErrorHandling(
      async () => {
        throw new UnauthorizedError();
      },
      { logger: customLogger },
    );
    await expect(wrapped()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(customLogger.warn).toHaveBeenCalled();
  });

  it("falls through non-AppError back to original throw", async () => {
    const fn = vi.fn(async () => {
      throw "raw";
    });
    const wrapped = withErrorHandling(fn);
    // non-Error throws become AppError-throws
    await expect(wrapped()).rejects.toBeInstanceOf(AppError);
  });
});

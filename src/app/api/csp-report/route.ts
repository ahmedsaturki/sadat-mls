import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkApiRateLimit } from "@/lib/security/rateLimit";

/**
 * CSP Violation Report Endpoint
 * Receives and logs CSP violation reports for security monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const rawIp = request.headers.get("x-forwarded-for") || "unknown";
    const ip = rawIp.split(",")[0].trim();
    const rate = await checkApiRateLimit(`csp-report:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate CSP report structure minimally
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid report format" }, { status: 400 });
    }

    const report = body as Record<string, unknown>;
    const cspReport = report["csp-report"] || report;

    // Log CSP violations for monitoring
    logger.warn("CSP Violation Report", {
      cspReport,
      userAgent: request.headers.get("user-agent"),
      ip,
    });

    // Do not store in DB to avoid potential abuse
    // Logs are sufficient for monitoring

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (err) {
    logger.error("CSP report endpoint error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
}

// Only accept POST
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * CSP Violation Report Endpoint
 * Receives and logs CSP violation reports for security monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log CSP violations for monitoring
    logger.warn("CSP Violation Report", {
      cspReport: body["csp-report"],
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    });
    
    // Do not store in DB to avoid potential abuse
    // Logs are sufficient for monitoring
    
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (err) {
    logger.error("CSP report endpoint error", { 
      error: err instanceof Error ? err.message : String(err) 
    });
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
}

// Only accept POST
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
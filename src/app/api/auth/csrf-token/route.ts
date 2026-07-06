import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CSRF_COOKIE_NAME, getOrCreateCsrfToken } from "@/lib/security/csrf";
import { checkApiRateLimit } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  try {
    const rawIp = request.headers.get("x-forwarded-for") || "unknown";
    const ip = rawIp.split(",")[0].trim();
    const rate = await checkApiRateLimit(`csrf-token:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
      );
    }

    const token = await getOrCreateCsrfToken();
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}

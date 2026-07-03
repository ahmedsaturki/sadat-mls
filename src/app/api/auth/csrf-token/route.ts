import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CSRF_COOKIE_NAME, getOrCreateCsrfToken } from "@/lib/security/csrf";

export async function GET() {
  try {
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

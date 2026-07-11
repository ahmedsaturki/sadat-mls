import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

// PATCH - Mark commission as paid (super admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`commissions-patch:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status, notes } = body as { status?: string; notes?: string };
    if (status !== "paid") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole
      .from("property_commissions")
      .update({ status: "paid", notes: notes || null })
      .eq("id", id);

    if (error) {
      logger.error("Failed to update commission", { error: error.message });
      return NextResponse.json({ error: "Failed to update commission" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Commission update error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

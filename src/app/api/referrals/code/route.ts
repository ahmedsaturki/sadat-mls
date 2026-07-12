import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

// GET - Get current office's referral code
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`referral-code-get:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.office_id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: office } = await supabase
      .from("offices")
      .select("id, name, referral_code")
      .eq("id", profile.office_id)
      .single();

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    return NextResponse.json({ code: office.referral_code, officeName: office.name });
  } catch (err) {
    logger.error("Referral code fetch error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Regenerate referral code
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`referral-code-post:${ip}`);
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
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.office_id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRole = createServiceRoleClient();

    // Generate new unique code
    let newCode: string;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: existing } = await serviceRole
        .from("offices")
        .select("id")
        .eq("referral_code", newCode)
        .single();
      if (!existing) isUnique = true;
      attempts++;
    }

    const { error } = await serviceRole
      .from("offices")
      .update({ referral_code: newCode! })
      .eq("id", profile.office_id);

    if (error) {
      logger.error("Failed to regenerate referral code", { error: error.message });
      return NextResponse.json({ error: "Failed to regenerate code" }, { status: 500 });
    }

    return NextResponse.json({ code: newCode! });
  } catch (err) {
    logger.error("Referral code regeneration error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

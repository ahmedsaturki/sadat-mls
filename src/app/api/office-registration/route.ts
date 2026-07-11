import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const officeRegistrationSchema = z.object({
  officeName: z.string().min(2).max(100),
  officeEmail: z.string().email(),
  officePhone: z.string().optional().nullable(),
  officeAddress: z.string().optional().nullable(),
  adminName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rate = await checkApiRateLimit(`office-registration:${ip}`, undefined, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = officeRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { officeName, officeEmail, officePhone, officeAddress, adminName, adminEmail, adminPassword } = parsed.data;
    const supabase = createServiceRoleClient();

    // Check if office email already exists
    const { data: existingOffice } = await supabase
      .from("offices")
      .select("id")
      .eq("email", officeEmail)
      .maybeSingle();

    if (existingOffice) {
      return NextResponse.json({ error: "An office with this email already exists" }, { status: 409 });
    }

    // Check if admin email already registered
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }

    // Create office with pending status
    const slug = officeName.toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `office-${Date.now()}`;

    const { data: office, error: officeError } = await supabase
      .from("offices")
      .insert({
        name: officeName,
        slug,
        email: officeEmail,
        phone: officePhone || null,
        address: officeAddress || null,
        status: "pending",
        is_active: false,
      })
      .select("id, name")
      .single();

    if (officeError) {
      logger.error("Failed to create office registration", { error: officeError.message });
      return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
    }

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: "office_admin",
      },
    });

    if (authError || !authData.user) {
      // Rollback office
      await supabase.from("offices").delete().eq("id", office.id);
      logger.error("Failed to create admin user for registration", { error: authError?.message });
      return NextResponse.json({ error: "Failed to create admin account" }, { status: 500 });
    }

    // Link user to office
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        office_id: office.id,
        role: "office_admin",
        full_name: adminName,
      })
      .eq("id", authData.user.id);

    if (userUpdateError) {
      logger.error("Failed to link user to office", { error: userUpdateError.message });
    }

    // Send emails (fire-and-forget)
    const { officeRegisteredEmail, officeApprovedEmail } = await import("@/lib/email/templates");
    const { sendEmail } = await import("@/lib/email/send");
    const { isEmailEnabled } = await import("@/lib/email/config");

    if (isEmailEnabled()) {
      // Email to super admins about new registration
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (admins?.length) {
        const { subject, html, text } = officeRegisteredEmail({
          locale: "ar",
          officeName,
          adminName,
        });
        for (const admin of admins) {
          if (admin.email) {
            sendEmail({ to: admin.email, subject, html, text }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted. Pending admin approval.",
      officeId: office.id,
    });
  } catch (err) {
    logger.error("Office registration error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

const acceptSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = acceptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, fullName, password } = parsed.data;
    const supabase = createServiceRoleClient();

    // Verify invitation
    const { data: invitation, error: lookupError } = await supabase
      .from("invitations")
      .select("id, email, office_id, status, expires_at")
      .eq("token", token)
      .single();

    if (lookupError || !invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation already used" }, { status: 410 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
    }

    // Create the user account
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirm since invited
    });

    if (createError) {
      logger.error("Failed to create user from invitation", { error: createError.message });
      return NextResponse.json({ error: createError.message || "Failed to create account" }, { status: 500 });
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("users")
      .upsert({
        id: userData.user.id,
        email: invitation.email,
        full_name: fullName,
        office_id: invitation.office_id,
        role: "office_agent",
      }, { onConflict: "id" });

    if (profileError) {
      logger.error("Failed to create user profile from invitation", { error: profileError.message });
      // Don't fail the whole flow — user account is created
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      logger.error("Failed to mark invitation as accepted", { error: updateError.message });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Invitation acceptance error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

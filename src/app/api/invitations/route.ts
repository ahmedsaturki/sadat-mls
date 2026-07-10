import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

const invitationSchema = z.object({
  email: z.string().email(),
  officeId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = invitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, officeId } = parsed.data;
    const supabase = createServiceRoleClient();

    // Get the inviting user's ID from the auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing pending invitation for this email + office
    const { data: existing } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("office_id", officeId)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json({ error: "Invitation already pending for this email" }, { status: 409 });
    }

    // Generate invitation token
    const crypto = require("crypto");
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const { error: insertError } = await supabase
      .from("invitations")
      .insert({
        office_id: officeId,
        email,
        invited_by: user.id,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logger.error("Failed to create invitation", { error: insertError.message });
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    // Send invitation email via Supabase Auth magic link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";
    const invitationUrl = `${siteUrl}/ar/invitations/accept?token=${inviteToken}`;

    // Use Supabase to send the email (or log it for now)
    logger.info("Invitation created", { email, officeId, token: inviteToken.substring(0, 8) + "..." });

    return NextResponse.json({
      success: true,
      message: "Invitation created",
      invitationUrl,
    });
  } catch (err) {
    logger.error("Invitation creation error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

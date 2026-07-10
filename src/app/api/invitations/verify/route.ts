import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("email, office_id, status, expires_at")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Invitation already used" }, { status: 410 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }

  return NextResponse.json({
    email: invitation.email,
    officeId: invitation.office_id,
  });
}

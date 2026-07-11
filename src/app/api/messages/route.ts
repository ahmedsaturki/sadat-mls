import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const sendMessageSchema = z.object({
  contact_request_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  recipient_office_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  visitor_name: z.string().max(200).optional(),
  visitor_email: z.string().email().max(255).optional(),
  visitor_phone: z.string().max(50).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(2000),
  attachment_url: z.string().url().optional(),
  attachment_name: z.string().max(200).optional(),
});

// GET - List messages for current user's office
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`messages-get:${ip}`);
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
      .select("office_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.office_id) {
      return NextResponse.json({ messages: [], unreadCount: 0 });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, contact_request_id, office_id, sender_id, sender_type, visitor_name, visitor_email, visitor_phone, property_id, recipient_office_id, parent_id, subject, body, is_read, created_at, attachment_url, attachment_name")
      .or(`office_id.eq.${profile.office_id},recipient_office_id.eq.${profile.office_id}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Failed to fetch messages", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    const unreadCount = (messages || []).filter((m) => !m.is_read).length;

    return NextResponse.json({ messages: messages || [], unreadCount });
  } catch (err) {
    logger.error("Messages GET error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`messages-post:${ip}`);
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
      .select("office_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.office_id) {
      return NextResponse.json({ error: "No office" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { error } = await supabase.from("messages").insert({
      office_id: profile.office_id,
      sender_id: user.id,
      sender_type: "agent",
      recipient_office_id: parsed.data.recipient_office_id || null,
      parent_id: parsed.data.parent_id || null,
      visitor_name: parsed.data.visitor_name,
      visitor_email: parsed.data.visitor_email,
      visitor_phone: parsed.data.visitor_phone,
      property_id: parsed.data.property_id,
      contact_request_id: parsed.data.contact_request_id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      attachment_url: parsed.data.attachment_url || null,
      attachment_name: parsed.data.attachment_name || null,
      is_read: false,
    });

    if (error) {
      logger.error("Failed to send message", { error: error.message });
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Messages POST error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`messages-patch:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      logger.error("Failed to mark messages read", { error: error.message });
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Messages PATCH error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

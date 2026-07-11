import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.unknown()),
});

// GET - List user's saved searches
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`saved-searches-get:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: searches, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch saved searches", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 });
    }

    return NextResponse.json({ savedSearches: searches || [] });
  } catch (err) {
    logger.error("Saved searches API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a saved search
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`saved-searches-post:${ip}`);
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createSavedSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Get user's office_id
    const { data: profile } = await supabase
      .from("users")
      .select("office_id")
      .eq("id", user.id)
      .single();

    const { data: search, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        office_id: profile?.office_id || null,
        name: parsed.data.name,
        filters: parsed.data.filters,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create saved search", { error: error.message });
      return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedSearch: search });
  } catch (err) {
    logger.error("Saved search create error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a saved search
export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`saved-searches-delete:${ip}`);
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

    const searchParams = request.nextUrl.searchParams;
    const searchId = searchParams.get("id");
    if (!searchId) {
      return NextResponse.json({ error: "Missing search ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", searchId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Failed to delete saved search", { error: error.message });
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Saved search delete error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

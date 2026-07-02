import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export const revalidate = 300; // ISR: 5 minutes

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get active office IDs - cached at edge/network level.
 * Uses service role client to avoid cookies in SSG context.
 */
export async function GET() {
  try {
    const { data: offices, error } = await supabaseAdmin
      .from("offices")
      .select("id")
      .eq("is_active", true);

    if (error) {
      logger.error("Failed to fetch active offices", { error: error.message });
      return new Response(JSON.stringify({ ids: [] }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ids = (offices as { id: string }[] | null)?.map((o) => o.id) || [];
    
    return new Response(JSON.stringify({ ids }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60"
      }
    });
  } catch (err) {
    logger.error("Active offices API error", { 
      error: err instanceof Error ? err.message : "Unknown" 
    });
    return new Response(JSON.stringify({ ids: [] }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
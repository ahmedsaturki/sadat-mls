import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const OFFICE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedOfficeIds: { ids: Set<string>; expires: number } | null = null;
let pendingPromise: Promise<Set<string>> | null = null;

/**
 * Get active office IDs with server-side deduplication.
 * Prevents race conditions when multiple requests come in simultaneously.
 */
export async function getActiveOfficeIds(): Promise<Set<string>> {
  const now = Date.now();
  
  if (cachedOfficeIds && now < cachedOfficeIds.expires) {
    return cachedOfficeIds.ids;
  }
  
  // Return existing promise if there's already a request in flight
  if (pendingPromise) {
    return pendingPromise;
  }
  
  // Start new fetch
  pendingPromise = (async () => {
    try {
      const supabase = await createClient();
      const { data: officesData } = await supabase
        .from("offices")
        .select("id")
        .eq("is_active", true);
      
      const ids = new Set(
        (officesData as { id: string }[] | null)?.map((o) => o.id) || []
      );
      
      cachedOfficeIds = {
        ids,
        expires: now + OFFICE_CACHE_TTL_MS,
      };
      
      return ids;
    } catch (err) {
      logger.error("Failed to fetch active office IDs", { 
        error: err instanceof Error ? err.message : "Unknown" 
      });
      return new Set<string>();
    } finally {
      pendingPromise = null;
    }
  })();
  
  return pendingPromise;
}
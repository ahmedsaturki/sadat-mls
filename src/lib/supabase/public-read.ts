import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = "https://aaxauqznfhcvgevfczye.supabase.co";
const VERIFIED_PUBLISHABLE_KEY =
  "sb_publishable_vjUNgHd3RS2KbXFRYL6k_w_qkAwTT8J";

export function createPublicReadClient() {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("sb_publishable_")
      ? VERIFIED_PUBLISHABLE_KEY
      : VERIFIED_PUBLISHABLE_KEY;

  return createClient<Database>(SUPABASE_URL, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

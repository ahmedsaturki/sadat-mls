import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/public-config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  }
  return browserClient;
}

export const supabase = createClient();

import { createBrowserClient } from "@supabase/ssr";
import type { AqaratDatabase } from "@/lib/supabase/aqarat-types";

let browserClient: ReturnType<typeof createBrowserClient<AqaratDatabase>> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<AqaratDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export const supabase = createClient();

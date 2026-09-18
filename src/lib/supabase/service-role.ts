import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service-role key for server-side operations
 * that need to bypass Row Level Security (RLS).
 *
 * Use cases:
 * - Rate limiting (operational logging)
 * - Background cleanup jobs
 * - Admin operations that need full access
 *
 * WARNING: Never expose this client to the browser or use in client components.
 * The service-role key bypasses ALL RLS policies.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables for server-side client. " +
      "Ensure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

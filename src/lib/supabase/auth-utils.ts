import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/utils/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  office_id: string | null;
}

let cachedClient: SupabaseClient | null = null;
let cachedUser: { user: { id: string } | null; profile: UserProfile | null } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

const pendingRequests = new Map<string, Promise<{ user: { id: string } | null; profile: UserProfile | null }>>();

export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
}

export function clearAuthCache() {
  cachedUser = null;
  cacheTimestamp = 0;
}

export async function getUserWithDeduplication(): Promise<{ user: { id: string } | null; profile: UserProfile | null }> {
  const cacheKey = "getUser";
  
  if (cachedUser && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedUser;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const result = { user: { id: user.id }, profile: profile as UserProfile | null };
    cachedUser = result;
    cacheTimestamp = Date.now();
    return result;
  })();

  pendingRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const supabaseError = error as { code?: string; status?: number };
      if (supabaseError?.code === "over_request_rate_limit" || supabaseError?.status === 429) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
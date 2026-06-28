"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type { UserRole } from "@/lib/utils/constants";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  office_id: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  supabase: ReturnType<typeof createClient>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<User | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let cachedUser: User | null = null;
let cachedProfile: UserProfile | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;
let loadingPromise: Promise<User | null> | null = null;

const supabaseClient = createClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (force = false): Promise<User | null> => {
    const now = Date.now();

    if (!force && cachedUser && now - cacheTimestamp < CACHE_DURATION) {
      setUser(cachedUser);
      setProfile(cachedProfile);
      return cachedUser;
    }

    if (!force && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("auth-cache");
        if (stored) {
          const data = JSON.parse(stored);
          if (now - data.timestamp < CACHE_DURATION && data.userId) {
            // Only use sessionStorage to know which user was logged in;
            // never trust the cached profile — always fetch from Supabase.
            // Proceed to the getUser + profile query below.
          }
        }
      } catch {}
    }

    if (loadingPromise && !force) {
      return loadingPromise;
    }

    loadingPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();

        if (authError) {
          logger.warn("Auth fetch failed", { error: authError.message });
          cachedUser = null;
          cachedProfile = null;
          cacheTimestamp = 0;
          setUser(null);
          setProfile(null);
          return null;
        }

        if (!authUser) {
          cachedUser = null;
          cachedProfile = null;
          cacheTimestamp = 0;
          setUser(null);
          setProfile(null);
          return null;
        }

        cachedUser = authUser;
        cacheTimestamp = now;

        const { data: profileData } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        cachedProfile = profileData as UserProfile;

        if (typeof window !== "undefined") {
          // Only store userId — never the full profile (XSS privilege escalation risk)
          sessionStorage.setItem("auth-cache", JSON.stringify({
            userId: cachedUser?.id || null,
            timestamp: cacheTimestamp,
          }));
        }

        setUser(cachedUser);
        setProfile(cachedProfile);
        return cachedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Auth error";
        setError(message);
        cachedUser = null;
        cachedProfile = null;
        cacheTimestamp = 0;
        return null;
      } finally {
        setLoading(false);
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }, []);

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
      if (session?.user) {
        loadUser(true);
      } else {
        cachedUser = null;
        cachedProfile = null;
        cacheTimestamp = 0;
        setUser(null);
        setProfile(null);
        sessionStorage.removeItem("auth-cache");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      supabase: supabaseClient,
      loading,
      error,
      isAuthenticated: !!user,
      refresh: loadUser,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthUser must be used within AuthProvider");
  }
  return context;
}
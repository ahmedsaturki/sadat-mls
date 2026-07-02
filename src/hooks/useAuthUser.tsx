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

const supabaseClient = createClient();
const CACHE_DURATION = 5 * 60 * 1000;

interface AuthCache {
  user: User | null;
  profile: UserProfile | null;
  timestamp: number;
}

function createAuthCache(): AuthCache {
  return {
    user: null,
    profile: null,
    timestamp: 0,
  };
}

let authCache: AuthCache = createAuthCache();
let loadingPromise: Promise<User | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (force = false): Promise<User | null> => {
    const now = Date.now();

    if (!force && authCache.user && now - authCache.timestamp < CACHE_DURATION) {
      setUser(authCache.user);
      setProfile(authCache.profile);
      return authCache.user;
    }

    if (!force && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("auth-cache");
        if (stored) {
          const data = JSON.parse(stored);
          if (now - data.timestamp < CACHE_DURATION && data.userId) {
            // Only use sessionStorage to know which user was logged in;
            // never trust the cached profile — always fetch from Supabase.
          }
        }
      } catch {
        // ignore parse errors
      }
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
          if (!authError.message?.includes("session missing")) {
            logger.warn("Auth fetch failed", { error: authError.message });
          }
          authCache = createAuthCache();
          setUser(null);
          setProfile(null);
          return null;
        }

        if (!authUser) {
          authCache = createAuthCache();
          setUser(null);
          setProfile(null);
          return null;
        }

        authCache.user = authUser;
        authCache.timestamp = now;

        const { data: profileData } = await supabaseClient
          .from("users")
          .select("id, email, full_name, role, office_id, avatar_url, phone, is_active, created_at, updated_at")
          .eq("id", authUser.id)
          .maybeSingle();

        authCache.profile = profileData as UserProfile;

        if (typeof window !== "undefined") {
          // Only store userId — never the full profile (XSS privilege escalation risk)
          sessionStorage.setItem("auth-cache", JSON.stringify({
            userId: authCache.user?.id || null,
            timestamp: authCache.timestamp,
          }));
        }

        setUser(authCache.user);
        setProfile(authCache.profile);
        return authCache.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Auth error";
        setError(message);
        authCache = createAuthCache();
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
        authCache = createAuthCache();
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
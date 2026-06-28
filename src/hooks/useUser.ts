"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { UserRole } from "@/lib/utils/constants";
import { getUserWithDeduplication, clearAuthCache } from "@/lib/supabase/auth-utils";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  office_id: string | null;
}

interface UseUserReturn {
  user: { id: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: authUser, profile: profileData } = await getUserWithDeduplication();

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(authUser);
      
      if (!profileData) {
        logger.error("Profile fetch failed", { userId: authUser.id });
        setError("Failed to load user profile. Please refresh the page.");
        setLoading(false);
        return;
      }
      
      const { error: profileError } = await createClient().from("users").select("*").eq("id", authUser.id).single();
      if (profileError) {
        logger.error("Profile validation failed", { 
          error: profileError.message, 
          userId: authUser.id 
        });
      }

      setProfile(profileData as UserProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      logger.error("useUser hook error", { error: message });
      setError(message);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      clearAuthCache();
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const clearError = useCallback(() => setError(null), []);

  return { 
    user, 
    profile, 
    loading, 
    error, 
    isAuthenticated: !!user, 
    refresh: loadUser, 
    clearError 
  };
}

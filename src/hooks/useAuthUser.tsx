"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { authSchemas } from "@/lib/validation";
import { z } from "zod";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  officeId?: string;
  avatarUrl?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

function mapAuthUser(authUser: {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
}) : User {
  const metadata = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
    phone: authUser.phone ?? (typeof metadata.phone === "string" ? metadata.phone : undefined),
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
    // Authorization roles are deliberately not derived from user-editable metadata.
    role: undefined,
    officeId: undefined,
    isActive: true,
    createdAt: authUser.created_at,
  };
}

export function useAuthUser() {
  const auth = useAuth();
  const [supabaseClient] = useState(() => createClient());

  return {
    ...auth,
    profile: auth.user,
    supabase: supabaseClient,
    refresh: auth.clearError,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const isProcessingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const setAuthenticatedUser = (authUser: Parameters<typeof mapAuthUser>[0]) => {
      if (!isMounted) return;
      setState({
        user: mapAuthUser(authUser),
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    };

    const fetchSession = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!data.user) {
          if (isMounted) {
            setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
          }
          return;
        }

        setAuthenticatedUser(data.user);

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT" || !session?.user) {
            if (isMounted) {
              setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
            }
            return;
          }
          setAuthenticatedUser(session.user);
        });

        return () => authListener.subscription.unsubscribe();
      } catch (error) {
        if (!isMounted) return;
        const errorMessage = error instanceof Error ? error.message : "Authentication error";
        logger.error("Auth error:", { error: errorMessage });
        setState({ user: null, isLoading: false, isAuthenticated: false, error: errorMessage });
      } finally {
        isProcessingRef.current = false;
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = authSchemas.login.safeParse({ email, password, rememberMe });
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid login data";
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        return { success: false, error: errorMessage };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });
      if (error) {
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }
      if (!data.user) {
        const errorMessage = "Authentication did not return a user";
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        return { success: false, error: errorMessage };
      }

      const user = mapAuthUser(data.user);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      return { success: true, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      logger.error("Login exception:", { error: errorMessage });
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData: z.infer<typeof authSchemas.register>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = authSchemas.register.safeParse(userData);
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid registration data";
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        return { success: false, error: errorMessage };
      }

      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
            office_id: result.data.officeId,
          },
          emailRedirectTo: `${window.location.origin}/${window.location.pathname.split("/")[1]}/verify-email?registered=true`,
        },
      });

      if (error) {
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }

      if (!data.user) {
        const errorMessage = "Registration did not return a user";
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        return { success: false, error: errorMessage };
      }

      setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      return {
        success: true,
        user: mapAuthUser({
          ...data.user,
          user_metadata: {
            ...(data.user.user_metadata ?? {}),
            full_name: result.data.fullName,
          },
        }),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      logger.error("Register exception:", { error: errorMessage });
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      logger.error("Logout exception:", { error: errorMessage });
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = authSchemas.forgotPassword.safeParse({ email });
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid email";
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        return { success: false, error: errorMessage };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${window.location.origin}/${window.location.pathname.split("/")[1]}/reset-password`,
      });
      if (error) {
        setState((prev) => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Password reset failed";
      logger.error("Reset password exception:", { error: errorMessage });
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user?.id) return { success: false, error: "Not authenticated" };

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          phone: updates.phone,
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Profile update did not return a user");

      const updatedUser = mapAuthUser(data.user);
      setState((prev) => ({ ...prev, user: updatedUser, isLoading: false }));
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Profile update failed";
      logger.error("Profile update exception:", { error: errorMessage });
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  }, [state.user?.id]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    clearError,
  };
}
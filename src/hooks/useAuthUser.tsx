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
  emailConfirmedAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
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

  // Fetch initial session
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session?.user) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, email, full_name, phone, role, office_id, avatar_url, is_active, created_at, email_confirmed_at")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!isMounted) return;

        const user: User = {
          id: profile.id,
          email: profile.email || session.user.email || "",
          fullName: profile.full_name,
          phone: profile.phone,
          role: profile.role,
          officeId: profile.office_id,
          avatarUrl: profile.avatar_url,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          emailConfirmedAt: profile.email_confirmed_at,
        };

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        // Setup auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event: string, session: { user: { id: string; email?: string } } | null) => {
            if (event === "SIGNED_OUT" || !session) {
              if (isMounted) {
                setState({
                  user: null,
                  isLoading: false,
                  isAuthenticated: false,
                  error: null,
                });
              }
            } else if (event === "SIGNED_IN" && session?.user) {
              // Fetch profile for signed-in user
              const { data: profile } = await supabase
                .from("users")
                .select("id, email, full_name, phone, role, office_id, avatar_url, is_active, created_at, email_confirmed_at")
                .eq("id", session.user.id)
                .single();

              if (!isMounted) return;

              if (profile) {
                const user: User = {
                  id: profile.id,
                  email: profile.email || session.user.email || "",
                  fullName: profile.full_name,
                  phone: profile.phone,
                  role: profile.role,
                  officeId: profile.office_id,
                  avatarUrl: profile.avatar_url,
                  isActive: profile.is_active,
                  createdAt: profile.created_at,
                  emailConfirmedAt: profile.email_confirmed_at,
                };

                setState((prev) => ({
                  ...prev,
                  user,
                  isAuthenticated: true,
                  error: null,
                }));
              }
            }
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        if (!isMounted) return;

        const errorMessage =
          error instanceof Error ? error.message : "Authentication error";

        logger.error("Auth error:", { error: errorMessage });

        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
        });
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

      // Validate input
      const result = authSchemas.login.safeParse({ email, password, rememberMe });
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid input";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        const errorMessage = error.message || "Login failed";
        logger.error("Login error:", { error: error instanceof Error ? error.message : String(error) });

        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      if (!data.session || !data.user) {
        const errorMessage = "Invalid credentials";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, email, full_name, role, office_id, avatar_url, is_active, created_at")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        logger.error("Error fetching user profile:", profileError);
        setState((prev) => ({ ...prev, error: "Login successful but failed to fetch user data" }));
      }

      const user: User = {
        id: profile?.id || data.user.id,
        email: profile?.email || data.user.email || "",
        fullName: profile?.full_name,
        role: profile?.role,
        officeId: profile?.office_id,
        avatarUrl: profile?.avatar_url,
        isActive: profile?.is_active,
        createdAt: profile?.created_at,
      };

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      logger.error("Login exception:", { error: errorMessage });

      setState((prev) => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const register = useCallback(async (userData: z.infer<typeof authSchemas.register>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Validate input
      const result = authSchemas.register.safeParse(userData);
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid input";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
            role: "office_agent",
            office_id: result.data.officeId,
          },
          emailRedirectTo: `${window.location.origin}/ar/verify-email?registered=true`,
        },
      });

      if (error) {
        const errorMessage = error.message || "Registration failed";
        logger.error("Register error:", { error: error instanceof Error ? error.message : String(error) });

        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        const errorMessage = "Registration successful but user was not created";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      // For email confirmation required, show success message
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || "",
          fullName: result.data.fullName,
          role: "office_agent",
          officeId: result.data.officeId,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      logger.error("Register exception:", { error: error instanceof Error ? error.message : String(error) });

      setState((prev) => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error("Logout error:", { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      logger.error("Logout exception:", { error: error instanceof Error ? error.message : String(error) });

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = authSchemas.forgotPassword.safeParse({ email });
      if (!result.success) {
        const errorMessage = result.error.issues[0]?.message || "Invalid email";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${window.location.origin}/ar/reset-password`,
      });

      if (error) {
        const errorMessage = error.message || "Password reset request failed";
        logger.error("Reset password error:", { error: error instanceof Error ? error.message : String(error) });

        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Password reset request failed";
      logger.error("Reset password exception:", { error: error instanceof Error ? error.message : String(error) });

      setState((prev) => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user?.id) {
      return { success: false, error: "No user found" };
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from("users")
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.user.id)
        .select()
        .single();

      if (error) {
        const errorMessage = error.message || "Profile update failed";
        logger.error("Profile update error:", { error: error instanceof Error ? error.message : String(error) });

        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      const updatedUser: User = {
        ...state.user,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
      };

      setState((prev) => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));

      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Profile update failed";
      logger.error("Profile update exception:", { error: error instanceof Error ? error.message : String(error) });

      setState((prev) => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.user]);

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
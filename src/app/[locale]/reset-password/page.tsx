"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ArrowRight, KeyRound, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import {
  getPasswordRuleErrors,
  DEFAULT_PASSWORD_RULES,
} from "@/lib/security/password-rules";

export default function ResetPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const locale = usePageLocale(params);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const dict = getMessages(locale);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string; width: string } => {
    const errors = getPasswordRuleErrors(pwd, DEFAULT_PASSWORD_RULES);
    // Score based on how many rules pass (7 total rules)
    const totalRules = 7;
    const passed = totalRules - errors.length;
    const score = Math.max(0, Math.min(totalRules, passed));

    if (score <= 2) return { score, label: dict.auth?.weak || "Weak", color: "bg-red-500", width: "w-1/5" };
    if (score <= 4) return { score, label: dict.auth?.fair || "Fair", color: "bg-yellow-500", width: "w-3/5" };
    return { score, label: dict.auth?.strong || "Strong", color: "bg-green-500", width: "w-full" };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(dict.auth.passwordMismatch);
      return;
    }

    // Use centralized password rules for validation
    const passwordErrors = getPasswordRuleErrors(password, DEFAULT_PASSWORD_RULES);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // Show the actual Supabase error so user knows why (e.g. "Password should be at least 8 characters")
      setError(updateError.message || dict.auth.resetPasswordError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    timerRef.current = setTimeout(() => {
      router.push(`/${locale}/login`);
    }, 3000);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        // Use getUser() to validate token against Supabase server, not just local cache
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setReady(true);
          setError(dict.auth.invalidResetLink);
          return;
        }

        setReady(true);
      } catch {
        setReady(true);
        setError(dict.auth.invalidResetLink);
      }
    };
    checkSession();
  }, [dict.auth.invalidResetLink, searchParams]);

  if (!ready && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>{dict.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 rounded"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {dict.auth.backToLogin}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.common.appName}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center space-y-4" role="status" aria-live="polite">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.resetPasswordSuccess}
              </h2>
              <p className="text-sm text-gray-500">
                {dict.auth.redirecting}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 justify-center mb-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {dict.auth.resetPasswordTitle}
                </h2>
              </div>

              {error ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                  >
                    {dict.auth.forgotPassword}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4 mt-4">
                  <Input
                    label={dict.auth.newPasswordLabel}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />

                  {password.length > 0 && (
                    <div className="mt-1" role="group" aria-label={dict.auth.passwordStrength || "Password strength"}>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <p className={`text-xs mt-1 ${strength.color.replace("bg-", "text-")}`}>{strength.label}</p>
                      <ul className="mt-2 space-y-0.5" aria-label={dict.auth.passwordRequirements || "Password requirements"}>
                        {[
                          { test: password.length >= 8, label: dict.auth.ruleMinLength || "At least 8 characters" },
                          { test: password.length <= 128, label: dict.auth.ruleMaxLength || "Max 128 characters" },
                          { test: /[A-Z]/.test(password), label: dict.auth.ruleUppercase || "One uppercase letter" },
                          { test: /[a-z]/.test(password), label: dict.auth.ruleLowercase || "One lowercase letter" },
                          { test: /\d/.test(password), label: dict.auth.ruleNumber || "One number" },
                          { test: /[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(password), label: dict.auth.ruleSpecial || "One special character" },
                        ].map((rule) => (
                          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                            <span className={rule.test ? "text-green-500" : "text-gray-400"} aria-hidden="true">
                              {rule.test ? "✓" : "○"}
                            </span>
                            <span className={rule.test ? "text-green-600" : "text-gray-500"}>{rule.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Input
                    label={dict.auth.confirmPasswordLabel}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />

                  {error && (
                    <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                    {dict.auth.resetPasswordButton}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

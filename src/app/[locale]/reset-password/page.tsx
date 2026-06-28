"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ArrowRight, KeyRound, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";

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

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (password !== confirmPassword) {
        setError(dict.auth.passwordMismatch);
        return;
      }

      if (password.length < 8) {
        setError(dict.auth.passwordMinLength);
        return;
      }

      setLoading(true);

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(dict.auth.resetPasswordError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 3000);
    },
    [password, confirmPassword, dict, locale, router],
  );

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setReady(!!session);

      if (!session) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {dict.auth.backToLogin}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sadat MLS Cloud</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center space-y-4">
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
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
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
    </div>
  );
}

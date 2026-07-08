"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Building2, ArrowRight, Mail, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { logger } from "@/lib/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  locked?: boolean;
  error?: string;
}

export default function ForgotPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const locale = usePageLocale(params);

  const dict = getMessages(locale);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      // Client-side email validation
      if (!email.trim()) {
        setError(dict.auth.emailRequired || dict.auth.forgotPasswordError);
        setLoading(false);
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        setError(dict.auth.emailInvalid || dict.auth.forgotPasswordError);
        setLoading(false);
        return;
      }

      // Server-side rate limiting check
      let rateResult: RateLimitResponse;
      try {
        const response = await fetch("/api/auth/forgot-rate-limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        rateResult = await response.json();
      } catch (err) {
        logger.error("Rate limit check failed, allowing request", { error: err instanceof Error ? err.message : String(err) });
        rateResult = { allowed: true, remaining: 5, retryAfter: 0 };
      }

      if (!rateResult.allowed) {
        setError(rateResult.error || dict.auth.rateLimited?.replace("{{seconds}}", String(rateResult.retryAfter)) || dict.common.unexpectedError);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/${locale}/auth/callback?next=/${locale}/reset-password`,
      });

      if (resetError) {
        setError(dict.auth.forgotPasswordError);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    },
    [email, locale, dict],
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-navy-200 hover:text-white mb-8 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-600 rounded"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {dict.auth.backToLogin}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-navy-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.common.appName}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4" role="status" aria-live="polite">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.forgotPasswordSent}
              </h2>
              <p className="text-sm text-gray-500">{email}</p>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-4 text-sm text-navy-600 hover:text-navy-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
              >
                {dict.auth.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 justify-center mb-2">
                <Mail className="w-5 h-5 text-navy-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {dict.auth.forgotPasswordTitle}
                </h2>
              </div>
              <p className="text-sm text-gray-500 text-center mb-6">
                {dict.auth.forgotPasswordDesc}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={dict.auth.emailLabel}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />

                {error && (
                  <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  {dict.auth.forgotPasswordButton}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { logger } from "@/lib/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LOGIN_ATTEMPTS = 5;

interface RateLimitResponse { allowed: boolean; remaining: number; retryAfter: number; locked?: boolean; error?: string; }

export default function LoginClient({ params }: { params: { locale: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const locale = usePageLocale(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = getMessages(locale);

  const checkRateLimit = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/rate-limit", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data: RateLimitResponse = await response.json();
      if (!response.ok || typeof data.allowed !== "boolean") {
        setError(data.error || dict.common.unexpectedError);
        return false;
      }
      if (!data.allowed) { setAttemptsRemaining(0); setError(data.error || dict.common.rateLimitExceeded.replace("{{minutes}}", String(Math.ceil(data.retryAfter / 60)))); return false; }
      setAttemptsRemaining(data.remaining); return true;
    } catch (err) {
      logger.error("Rate limit check failed", { error: err instanceof Error ? err.message : String(err) });
      setError(dict.common.unexpectedError);
      return false;
    }
  }, [dict.common.rateLimitExceeded, dict.common.unexpectedError]);

  useEffect(() => { checkRateLimit(); }, [checkRateLimit]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    if (!email.trim()) { setError(dict.auth.emailRequired || dict.auth.loginError); setLoading(false); return; }
    if (!EMAIL_REGEX.test(email)) { setError(dict.auth.emailInvalid || dict.auth.loginError); setLoading(false); return; }
    if (!(await checkRateLimit())) { setLoading(false); return; }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      if (authError.message.includes("Email not confirmed") || authError.message.includes("email not verified")) {
        setError(dict.auth.emailNotVerified); setLoading(false); return;
      }
      if (!(await checkRateLimit())) { setError(dict.common.rateLimitLocked); setAttemptsRemaining(0); }
      else { setError(dict.auth.loginError); setAttemptsRemaining(Math.max(0, (attemptsRemaining || MAX_LOGIN_ATTEMPTS) - 1)); }
      setLoading(false); return;
    }

    if (!data.user) { setError(dict.auth.loginError); setLoading(false); return; }
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut(); setError(dict.auth.emailNotVerified); setLoading(false); return;
    }

    const nextParam = searchParams.get("next");
    router.push(nextParam && nextParam.startsWith("/") ? nextParam : `/${locale}/explore`);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -end-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full" aria-hidden="true" />
      </div>
      <div className="w-full max-w-md relative">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-navy-200 hover:text-white mb-8 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-600 rounded">
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />{dict.common.home}
        </Link>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-navy-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{dict.common.login}</h1>
              <h2 className="text-sm font-medium text-gray-600">{dict.auth.platformSubtitle}</h2>
              <p className="text-xs text-gray-500">{dict.common.appName}</p>
            </div>
          </div>
          {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm" role="alert">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input label={dict.auth.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <Input label={dict.auth.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <div className="flex justify-end">
              <Link href={`/${locale}/forgot-password`} className="text-sm text-navy-600 hover:text-navy-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 rounded">
                {dict.auth.forgotPassword}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? dict.common.loading : dict.common.login}</Button>
          </form>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { ROLES } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";

const LOGIN_RATE_LIMIT_KEY = "sadat_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getLoginAttempts(): { count: number; firstAttemptAt: number } {
  if (typeof window === "undefined") return { count: 0, firstAttemptAt: 0 };
  try {
    const data = localStorage.getItem(LOGIN_RATE_LIMIT_KEY);
    if (!data) return { count: 0, firstAttemptAt: 0 };
    const parsed = JSON.parse(data);
    // Reset if lockout period has passed
    if (Date.now() - parsed.firstAttemptAt > LOCKOUT_DURATION_MS) {
      localStorage.removeItem(LOGIN_RATE_LIMIT_KEY);
      return { count: 0, firstAttemptAt: 0 };
    }
    return parsed;
  } catch (err) {
    logger.error("Failed to parse login rate limit data", { error: err instanceof Error ? err.message : String(err) });
    return { count: 0, firstAttemptAt: 0 };
  }
}

function recordLoginAttempt(): { count: number; locked: boolean } {
  const current = getLoginAttempts();
  const newCount = current.count + 1;
  const firstAttemptAt = current.count === 0 ? Date.now() : current.firstAttemptAt;
  localStorage.setItem(LOGIN_RATE_LIMIT_KEY, JSON.stringify({ count: newCount, firstAttemptAt }));
  return { count: newCount, locked: newCount >= MAX_LOGIN_ATTEMPTS };
}

function clearLoginAttempts() {
  localStorage.removeItem(LOGIN_RATE_LIMIT_KEY);
}

export default function LoginPage({
  params,
}: {
  params: { locale: string };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const locale = usePageLocale(params);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const router = useRouter();

  const dict = getMessages(locale);

  const checkRateLimit = useCallback(() => {
    const { count } = getLoginAttempts();
    if (count >= MAX_LOGIN_ATTEMPTS) {
      const { firstAttemptAt } = getLoginAttempts();
      const timeLeft = Math.ceil((LOCKOUT_DURATION_MS - (Date.now() - firstAttemptAt)) / 60000);
      setError(dict.common.rateLimitExceeded.replace("{{minutes}}", String(timeLeft)));
      setAttemptsRemaining(0);
      return false;
    }
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS - count);
    return true;
  }, [dict.common.rateLimitExceeded]);

  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!checkRateLimit()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const { count, locked } = recordLoginAttempt();
      if (locked) {
        setError(dict.common.rateLimitLocked);
        setAttemptsRemaining(0);
      } else {
        setError(dict.auth.loginError);
        setAttemptsRemaining(MAX_LOGIN_ATTEMPTS - count);
      }
      setLoading(false);
      return;
    }

    // Clear attempts on successful login
    clearLoginAttempts();

    const { data: profile } = await supabase
      .from("users")
      .select("role, office_id")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === ROLES.SUPER_ADMIN) {
      router.push(`/${locale}/admin`);
    } else if (profile?.role === ROLES.OFFICE_ADMIN || profile?.role === ROLES.OFFICE_AGENT) {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push(`/${locale}/explore`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {dict.auth.backToHome}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sadat MLS Cloud</h1>
          <p className="text-blue-200 mt-1">{dict.auth.platformSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">{dict.auth.loginTitle}</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={dict.auth.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />

            <Input
              label={dict.auth.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <div className="text-right">
              <Link
                href={`/${locale}/forgot-password`}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {dict.auth.forgotPassword}
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 3 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 text-center">
                {dict.common.attemptsRemaining.replace("{{count}}", String(attemptsRemaining))}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={attemptsRemaining === 0}>
              {loading ? dict.auth.loggingIn : dict.auth.loginButton}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {dict.auth.adminNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

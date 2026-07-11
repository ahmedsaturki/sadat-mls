"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { logger } from "@/lib/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterClient({
  params,
}: {
  params: { locale: string };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const locale = usePageLocale(params);
  const router = useRouter();

  const dict = getMessages(locale);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError(dict.auth.nameRequired);
      setLoading(false);
      return;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email)) {
      setError(dict.auth.emailInvalid || dict.auth.signUpError);
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError(dict.auth.passwordMinLength);
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError(dict.auth.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          setError(dict.auth.loginError || dict.auth.signUpError);
        } else {
          logger.error("Registration failed", { error: authError.message });
          setError(dict.auth.signUpError);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      logger.error("Registration error", { error: err instanceof Error ? err.message : String(err) });
      setError(dict.auth.signUpError);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -end-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        </div>

        <div className="w-full max-w-md relative">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{dict.auth.signUpSuccess}</h2>
            <p className="text-sm text-gray-500 mb-6">{dict.auth.verifyEmailCheck}</p>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-700 font-medium text-sm"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              {dict.auth.backToLogin}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -end-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full" aria-hidden="true" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-navy-200 hover:text-white mb-8 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-600 rounded"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {dict.auth.backToHome}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-navy-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.common.appName}</h1>
          <p className="text-navy-200 mt-1">{dict.auth.platformSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">{dict.auth.signUpTitle}</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label={dict.auth.nameLabel}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict.auth.nameLabel}
              autoComplete="name"
              required
            />

            <Input
              label={dict.auth.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.common.emailPlaceholder}
              autoComplete="email"
              required
            />

            <Input
              label={dict.auth.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={dict.common.passwordPlaceholder}
              autoComplete="new-password"
              required
            />

            <Input
              label={dict.auth.confirmPasswordLabel}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={dict.common.passwordPlaceholder}
              autoComplete="new-password"
              required
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {loading ? dict.auth.signingUp : dict.auth.signUpButton}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              {dict.auth.alreadyHaveAccount}{" "}
              <Link href={`/${locale}/login`} className="text-navy-600 hover:text-navy-700 font-medium">
                {dict.auth.loginButton}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

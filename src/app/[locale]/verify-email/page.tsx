"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Building2, ArrowRight, Mail, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";

export default function VerifyEmailPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { user, refresh, supabase } = useAuthUser();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dict = getMessages(locale);

  // Poll for verification status every 5 seconds
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email_confirmed_at) {
          setStatus("success");
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (user) {
          setStatus("pending");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    };

    checkVerification();

    // Poll every 5 seconds while pending
    const interval = setInterval(checkVerification, 5000);
    pollIntervalRef.current = interval;

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [user, supabase]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    cooldownIntervalRef.current = timer;
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (!user?.email || resendCooldown > 0) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      
      if (response.ok) {
        setResent(true);
        setResendCooldown(60); // 60-second cooldown
        // Refresh auth to pick up any changes
        await refresh();
      } else {
        logger.warn("Resend verification failed", { status: response.status });
      }
    } catch (err) {
      logger.error("Resend verification error", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setResending(false);
    }
  }, [user, resendCooldown, refresh]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 rounded"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {dict.auth.backToHome}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.common.appName}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">{dict.common.loading}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4" role="status" aria-live="polite">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.verifyEmailSuccess}
              </h2>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              >
                {dict.auth.backToLogin}
              </Link>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center space-y-4">
              <Mail className="w-12 h-12 text-blue-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.verifyEmailTitle}
              </h2>
              <p className="text-sm text-gray-500">
                {dict.auth.verifyEmailCheck}
              </p>

              {resent ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600" role="status" aria-live="polite">
                  {dict.auth.resendVerificationSent}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleResend}
                  isLoading={resending}
                  disabled={resendCooldown > 0}
                  className="mt-4"
                >
                  {resendCooldown > 0
                    ? `${dict.auth.resendVerification} (${resendCooldown}s)`
                    : dict.auth.resendVerification}
                </Button>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4" role="alert" aria-live="assertive">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.verifyEmailFailed}
              </h2>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              >
                {dict.auth.backToLogin}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

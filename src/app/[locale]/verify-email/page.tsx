"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Building2, ArrowRight, Mail, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function VerifyEmailPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [resent, setResent] = useState(false);
  const { user, supabase } = useAuthUser();

  const dict = getMessages(locale);

  useEffect(() => {
    const checkVerification = async () => {
      if (user?.email_confirmed_at) {
        setStatus("success");
      } else if (user) {
        setStatus("pending");
      } else {
        setStatus("pending");
      }
    };
    checkVerification();
  }, [user]);

  const handleResend = useCallback(async () => {
    if (user?.email) {
      await supabase.auth.resend({ type: "signup", email: user.email });
      setResent(true);
    }
  }, [supabase, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full" />
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
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">{dict.common.loading}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.verifyEmailSuccess}
              </h2>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {dict.auth.resendVerificationSent}
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleResend}
                  className="mt-4"
                >
                  {dict.auth.resendVerification}
                </Button>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                {dict.auth.verifyEmailFailed}
              </h2>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {dict.auth.backToLogin}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

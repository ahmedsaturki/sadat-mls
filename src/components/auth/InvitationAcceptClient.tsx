"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import { getCsrfHeaders } from "@/lib/security/csrf-client";

interface InvitationAcceptClientProps {
  locale: Locale;
  dict: Messages;
  token: string;
}

export default function InvitationAcceptClient({ locale, dict, token }: InvitationAcceptClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/invitations/verify?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email || "");
          setOfficeName(data.officeName || "");
        } else {
          const data = await res.json();
          setError(data.error || dict.invitation.invalidInvitation);
        }
      } catch {
        setError(dict.invitation.invalidInvitation);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token, dict]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !password.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || dict.invitation.acceptFailed);
      }
    } catch {
      setError(dict.invitation.acceptFailed);
    } finally {
      setSubmitting(false);
    }
  }, [token, fullName, password, locale, router, dict]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{dict.invitation.invalidInvitation}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href={`/${locale}`}
            className="inline-block bg-navy-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-navy-700 transition-colors"
          >
            {dict.common.home}
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{dict.invitation.accountCreated}</h1>
          <p className="text-gray-600 mb-6">{dict.invitation.redirectingToLogin}</p>
          <Loader2 className="w-6 h-6 text-navy-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-navy-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{dict.invitation.acceptInvitation}</h1>
          <p className="text-gray-600 text-sm">
            {dict.invitation.youAreInvited}
            {officeName && (
              <span className="font-semibold text-navy-600"> {officeName}</span>
            )}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{dict.common.email}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{dict.invitation.fullName} *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              placeholder={dict.invitation.fullNamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{dict.invitation.setPassword} *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                placeholder={dict.invitation.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? dict.invitation.hidePassword : dict.invitation.showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{dict.invitation.passwordRequirements}</p>
          </div>

          <button
            type="submit"
            disabled={!fullName.trim() || !password.trim() || password.length < 8 || submitting}
            className="w-full bg-navy-600 text-white py-2.5 rounded-lg font-medium hover:bg-navy-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              dict.invitation.createAccount
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          {dict.invitation.expiryNotice}
        </p>
      </div>
    </div>
  );
}

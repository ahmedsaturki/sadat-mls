"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ArrowRight, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { logger } from "@/lib/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterOfficeClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const dict = getMessages(locale);

  const [formData, setFormData] = useState({
    officeName: "",
    officeEmail: "",
    officePhone: "",
    officeAddress: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.officeName.trim()) {
      setError(dict.admin.officeName);
      setLoading(false);
      return;
    }
    if (!formData.officeEmail.trim() || !EMAIL_REGEX.test(formData.officeEmail)) {
      setError(dict.auth.emailInvalid);
      setLoading(false);
      return;
    }
    if (!formData.adminName.trim()) {
      setError(dict.admin.adminNameRequired);
      setLoading(false);
      return;
    }
    if (!formData.adminEmail.trim() || !EMAIL_REGEX.test(formData.adminEmail)) {
      setError(dict.auth.emailInvalid);
      setLoading(false);
      return;
    }
    if (formData.adminPassword.length < 8) {
      setError(dict.auth.passwordMinLength);
      setLoading(false);
      return;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError(dict.auth.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/office-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeName: formData.officeName,
          officeEmail: formData.officeEmail,
          officePhone: formData.officePhone || null,
          officeAddress: formData.officeAddress || null,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || dict.common.unexpectedError);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      logger.error("Office registration error", { error: err instanceof Error ? err.message : String(err) });
      setError(dict.common.unexpectedError);
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
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{dict.auth.registerOfficeSuccess}</h2>
            <p className="text-sm text-gray-500 mb-6">{dict.auth.registerOfficeSuccessDesc}</p>
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
      </div>

      <div className="w-full max-w-lg relative">
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
          <h1 className="text-2xl font-bold text-white">{dict.nav.registerOffice}</h1>
          <p className="text-navy-200 mt-1">{dict.auth.registerOfficeDesc}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Office Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{dict.common.details}</h3>
              <div className="space-y-3">
                <Input
                  label={dict.admin.officeName}
                  value={formData.officeName}
                  onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                  required
                />
                <Input
                  label={dict.common.email}
                  type="email"
                  value={formData.officeEmail}
                  onChange={(e) => setFormData({ ...formData, officeEmail: e.target.value })}
                  required
                />
                <Input
                  label={dict.common.phone}
                  value={formData.officePhone}
                  onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })}
                />
                <Input
                  label={dict.common.address}
                  value={formData.officeAddress}
                  onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                />
              </div>
            </div>

            {/* Admin Info */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{dict.admin.adminData}</h3>
              <div className="space-y-3">
                <Input
                  label={dict.admin.adminName}
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  required
                />
                <Input
                  label={dict.admin.adminEmail}
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  required
                />
                <Input
                  label={dict.admin.adminPassword}
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label={dict.auth.confirmPasswordLabel}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {loading ? dict.auth.signingUp : dict.nav.registerOffice}
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

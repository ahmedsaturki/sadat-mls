"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { useToast } from "@/components/ui/Toast";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { logger } from "@/lib/logger";

function AcceptInvitationForm({ params }: { params: { locale: string } }) {
  const locale = usePageLocale(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToast();
  const dict = getMessages(locale);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<{ email: string; officeId: string } | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ fullName: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(dict.common.error || "Invalid invitation link");
      setLoading(false);
      return;
    }

    // Verify invitation token
    const verify = async () => {
      try {
        const res = await fetch(`/api/invitations/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || dict.common.error);
        } else {
          setInvitation(data);
        }
      } catch (err) {
        logger.error("Failed to verify invitation", { error: err instanceof Error ? err.message : String(err) });
        setError(dict.common.unexpectedError);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, dict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: formData.fullName,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || dict.common.error, "error");
        return;
      }

      showToast(dict.office.addAgent || "Account created successfully", "success");
      // Redirect to dashboard
      window.location.href = `/${locale}/dashboard`;
    } catch (err) {
      logger.error("Failed to accept invitation", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{dict.common.loading || "Loading..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">{dict.common.error}</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {dict.office.addAgent || "Join as Agent"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {dict.office.agentEmail}: {invitation?.email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={dict.admin.adminName || "Full Name"}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label={dict.office.agentPassword || "Password"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="new-password"
          />
          <Button type="submit" isLoading={submitting} className="w-full">
            {dict.office.addAgent || "Create Account"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AcceptInvitationForm params={params} />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useLocale, useTranslations } from "@/lib/i18n/client";

export default function LoginClient() {
  const locale = useLocale();
  const dict = useTranslations();
  const { login } = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? dict.common.unexpectedError);
      setAttemptsRemaining(null);
      return;
    }

    setAttemptsRemaining(null);
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    window.location.assign(safeNext || `/${locale}/explore`);
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
          <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-navy-600" aria-hidden="true" /></div><div><h1 className="text-2xl font-bold text-gray-900">{dict.common.login}</h1><p className="text-sm text-gray-500">{dict.common.appName}</p></div></div>
          {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm" role="alert">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input label={dict.auth.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <Input label={dict.auth.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? dict.common.loading : dict.common.login}</Button>
          </form>
        </div>
      </div>
    </main>
  );
}

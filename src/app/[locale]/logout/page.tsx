"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { LogOut } from "lucide-react";
import { usePageLocale } from "@/hooks/usePageLocale";
import { getMessages } from "@/i18n/getMessages";

export default function LogoutPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"confirm" | "loading" | "success" | "error">("confirm");
  const locale = usePageLocale(params);
  const dict = getMessages(locale);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleConfirmLogout = async () => {
    setStatus("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Logout failed", { error: error.message });
        setStatus("error");
        return;
      }
      document.cookie = "csrf_token=; path=/; max-age=0";
      try {
        sessionStorage.removeItem('compare_properties');
      } catch {
        // sessionStorage not available
      }
      setStatus("success");
      timerRef.current = setTimeout(() => {
        router.push(`/${locale}`);
        router.refresh();
      }, 800);
    } catch (err) {
      logger.error("Logout failed unexpectedly", { error: err instanceof Error ? err.message : String(err) });
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center max-w-md mx-auto px-4" aria-live="polite">
        {status === "confirm" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{dict.auth.logoutConfirmTitle}</h1>
            <p className="text-gray-600 mb-6">{dict.auth.logoutConfirmDesc}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              >
                {dict.common.cancel}
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
              >
                {dict.auth.logoutButton}
              </button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <LogOut className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-600 font-medium">{dict.auth.loggingOut}</p>
            <p className="text-sm text-gray-400 mt-1">{dict.auth.redirectingToHome}</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-600 font-medium">{dict.auth.logoutSuccess}</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-4">{dict.auth.logoutError}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-navy-600 hover:text-navy-700 font-medium text-sm"
            >
              {dict.auth.goHome}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

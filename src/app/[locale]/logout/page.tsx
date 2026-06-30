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
      sessionStorage.clear();
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
      <div className="text-center max-w-md mx-auto px-4">
        {status === "confirm" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{dict.auth.logoutConfirmTitle || "Sign Out?"}</h1>
            <p className="text-gray-600 mb-6">{dict.auth.logoutConfirmDesc || "Are you sure you want to sign out?"}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                {dict.common.cancel || "Cancel"}
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                {dict.auth.logoutButton || "Sign Out"}
              </button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <LogOut className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-600 font-medium">{dict.auth.loggingOut || "Signing out..."}</p>
            <p className="text-sm text-gray-400 mt-1">{dict.auth.redirecting || "Redirecting to home..."}</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-600 font-medium">{dict.auth.logoutSuccess || "Signed out successfully"}</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-4">{dict.auth.logoutError || "Error signing out"}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {dict.auth.backToHome || "Go to home"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

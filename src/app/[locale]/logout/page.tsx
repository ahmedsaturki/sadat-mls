"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [locale, setLocale] = useState("ar");

  useEffect(() => {
    const path = window.location.pathname;
    const detectedLocale = path.startsWith("/en") ? "en" : "ar";
    setLocale(detectedLocale);

    const supabase = createClient();

    const doLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("Logout failed", { error: error.message });
          setStatus("error");
          return;
        }
        document.cookie = "csrf_token=; path=/; max-age=0";
        setStatus("success");
        setTimeout(() => {
          router.push(`/${detectedLocale}`);
          router.refresh();
        }, 800);
      } catch (err) {
        logger.error("Logout failed unexpectedly", { error: err instanceof Error ? err.message : String(err) });
        setStatus("error");
      }
    };

    doLogout();
  }, [router]);

  const messages = {
    ar: {
      loading: "جاري تسجيل الخروج...",
      redirecting: "سيتم تحويلك للرئيسية",
      success: "تم تسجيل الخروج بنجاح",
      error: "حدث خطأ أثناء تسجيل الخروج",
      home: "العودة للرئيسية",
    },
    en: {
      loading: "Signing out...",
      redirecting: "Redirecting to home...",
      success: "Signed out successfully",
      error: "Error signing out",
      home: "Go to home",
    },
  };

  const msg = messages[locale as keyof typeof messages] || messages.ar;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          status === "error" ? "bg-red-100" : "bg-gray-100"
        }`}>
          <LogOut className={`w-8 h-8 ${status === "error" ? "text-red-500" : "text-gray-500"} ${
            status === "loading" ? "animate-pulse" : ""
          }`} />
        </div>
        {status === "loading" && (
          <>
            <p className="text-gray-600 font-medium">{msg.loading}</p>
            <p className="text-sm text-gray-400 mt-1">{msg.redirecting}</p>
          </>
        )}
        {status === "success" && (
          <p className="text-green-600 font-medium">{msg.success}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-600 font-medium mb-2">{msg.error}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {msg.home}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

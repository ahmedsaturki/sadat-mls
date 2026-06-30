"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/hooks/useAuthUser";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </ToastProvider>
  );
}

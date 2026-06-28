"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import type { UserRole } from "@/lib/utils/constants";

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale: Locale;
  dict: Messages;
  role: UserRole;
}

export default function DashboardLayout({ children, locale, dict, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeSidebar]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} userRole={role} />
      <div className="flex relative">
        {/* Mobile FAB */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-20 left-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
          aria-label={sidebarOpen ? dict.common.close : dict.common.open}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile overlay with fade */}
        <div
          className={`lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:w-64 lg:shrink-0">
          <Sidebar locale={locale} dict={dict} role={role} />
        </div>

        {/* Mobile sidebar with slide animation */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="h-full bg-white shadow-xl pt-16">
            <Sidebar locale={locale} dict={dict} role={role} onNavigate={closeSidebar} />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav locale={locale} dict={dict} role={role} />
    </div>
  );
}

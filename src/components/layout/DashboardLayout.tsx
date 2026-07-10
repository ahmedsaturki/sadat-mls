"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { useFocusTrap, useEscapeKey } from "@/lib/utils/a11y";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import type { UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale: Locale;
  dict: Messages;
  role: UserRole;
}

export default function DashboardLayout({ children, locale, dict, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { containerRef, handleKeyDown } = useFocusTrap(sidebarOpen);
  const { profile } = useAuthUser();

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEscapeKey(closeSidebar, sidebarOpen);

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
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-navy-600 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
      >
        {dict.common.skipToContent}
      </a>
      <Navbar locale={locale} dict={dict} userRole={role} />
      <div className="flex relative">
        {/* Mobile FAB */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-20 start-6 z-40 w-12 h-12 bg-navy-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-navy-700 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
          aria-label={sidebarOpen ? dict.common.close : dict.common.open}
        >
          {sidebarOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        {/* Sidebar */}
        <div
          ref={containerRef}
          className={`fixed inset-y-0 start-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          onKeyDown={handleKeyDown}
          aria-hidden={!sidebarOpen}
        >
          <Sidebar locale={locale} dict={dict} role={role} onNavigate={closeSidebar} profile={profile} />
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main id="dashboard-content" className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ms-64" : "ms-0"}`}>
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav locale={locale} dict={dict} role={role} />
    </div>
  );
}
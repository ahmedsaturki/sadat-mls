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
      <Navbar locale={locale} dict={dict} userRole={role} />
      <div className="flex relative">
        {/* Mobile FAB */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-20 left-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
          aria-label={sidebarOpen ? dict.common.close : dict.common.open}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <div
          ref={containerRef}
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          onKeyDown={handleKeyDown}
          aria-hidden={!sidebarOpen}
        >
          <Sidebar locale={locale} dict={dict} role={role} onNavigate={closeSidebar} profile={profile} />
        </div>

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
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
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import { ROLES, type UserRole } from "@/lib/utils/constants";

interface MobileBottomNavProps {
  locale: Locale;
  dict: Messages;
  role: UserRole;
}

export default function MobileBottomNav({ locale, dict, role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const links = useMemo(() => {
    if (role === ROLES.SUPER_ADMIN) {
      return [
        { href: `/${locale}/admin`, label: dict.nav.dashboard, icon: LayoutDashboard },
        { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search },
      ];
    }
    if (role === ROLES.OFFICE_ADMIN) {
      return [
        { href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard },
        { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search },
        { href: `/${locale}/dashboard/properties/new`, label: dict.nav.addProperty, icon: Plus },
        { href: `/${locale}/dashboard/settings`, label: dict.nav.settings, icon: Settings },
      ];
    }
    return [
      { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search },
      { href: `/${locale}/dashboard/properties`, label: dict.nav.myProperties, icon: Home },
    ];
  }, [locale, dict, role]);

  return (
    <nav className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-gray-200 safe-area-bottom" role="navigation" aria-label={dict.common.mobileNavigation}>
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/${locale}/dashboard` && link.href !== `/${locale}/admin` && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-[60px] focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2",
                isActive
                  ? "text-navy-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive && "text-navy-600")} aria-hidden="true" />
              <span className="truncate max-w-[64px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

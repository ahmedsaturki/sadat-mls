"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Globe, Home, LogOut, Menu, X, Search, Settings, LayoutDashboard, Mail, Heart, Info, MessageCircle } from "lucide-react";
import NotificationsBell from "@/components/layout/NotificationsBell";
import CitySelector from "@/components/layout/CitySelector";
import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { useEscapeKey } from "@/lib/utils/a11y";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import { ROLES, type UserRole } from "@/lib/utils/constants";

interface NavbarProps {
  locale: Locale;
  dict: Messages;
  userRole?: UserRole | null;
}

export default function Navbar({ locale, dict, userRole }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuthUser();

  const switchLocale = locale === "ar" ? "en" : "ar";
  const switchPath = pathname.replace(`/${locale}`, `/${switchLocale}`);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEscapeKey(closeMenu, mobileMenuOpen);

  const navLinks = useMemo(() => {
    const role = userRole ?? profile?.role;
    const links = [
      { href: `/${locale}`, label: dict.common.home, icon: Home, prefetch: true },
      { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search, prefetch: true },
      { href: `/${locale}/about`, label: dict.nav.about, icon: Info, prefetch: true },
      { href: `/${locale}/contact`, label: dict.nav.contact, icon: MessageCircle, prefetch: true },
    ];

    if (role === ROLES.SUPER_ADMIN) {
      links.push({ href: `/${locale}/admin`, label: dict.nav.dashboard, icon: Building2, prefetch: false });
    } else if (role === ROLES.OFFICE_ADMIN) {
      links.push({ href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard, prefetch: false });
      links.push({ href: `/${locale}/dashboard/contact-requests`, label: dict.nav.contactRequests, icon: Mail, prefetch: false });
      links.push({ href: `/${locale}/dashboard/favorites`, label: dict.common.favorites, icon: Heart, prefetch: false });
      links.push({ href: `/${locale}/dashboard/settings`, label: dict.nav.settings, icon: Settings, prefetch: false });
    }

    return links;
  }, [locale, dict, userRole, profile?.role]);

  const notificationsDict = useMemo(() => ({
    notifications: {
      title: dict.nav?.notifications,
      markAllRead: dict.nav?.markAllRead,
      noNotifications: dict.nav?.noNotifications,
      contactRequest: dict.nav?.contactRequest,
      propertyInquiry: dict.nav?.propertyInquiry,
      agentJoined: dict.nav?.agentJoined,
      system: dict.nav?.system,
      unread: dict.common?.unread,
      timeAgo: dict.common?.timeAgo,
    },
  }), [dict]);

  const isLoggedIn = !!(userRole ?? profile);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label={dict.common.mainNavigation}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2" prefetch aria-label={dict.common.home}>
            <Building2 className="w-8 h-8 text-navy-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">{dict.common.appName}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1" role="menubar">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.prefetch}
                role="menuitem"
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-navy-50 text-navy-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <link.icon className="w-4 h-4" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <Link
              href={switchPath}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              aria-label={dict.nav.switchLanguageLabel}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              {dict.nav.switchLanguage}
            </Link>

            {/* City Selector */}
            <CitySelector locale={locale} dict={dict} />

            {/* Notifications Bell (only for logged-in users) */}
            {isLoggedIn && (
              <NotificationsBell
                locale={locale}
                dict={notificationsDict}
              />
            )}

{/* Avatar + Login/Logout */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName || profile.email}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-navy-600 text-white flex items-center justify-center border border-gray-200 text-sm font-medium">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <Link
                href={`/${locale}/logout`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                aria-label={dict.common.logout}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{dict.common.logout}</span>
              </Link>
            </div>
          ) : (
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-navy-600 text-white hover:bg-navy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-500"
                prefetch
              >
                {dict.common.login}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? dict.common.close : dict.common.open}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-gray-200 bg-white transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"
        }`}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="px-4 py-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={link.prefetch}
              onClick={closeMenu}
              role="menuitem"
              aria-current={pathname === link.href ? "page" : undefined}
              tabIndex={mobileMenuOpen ? 0 : -1}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1",
                pathname === link.href
                  ? "bg-navy-50 text-navy-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <link.icon className="w-4 h-4" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

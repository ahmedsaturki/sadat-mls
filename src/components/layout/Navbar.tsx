"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Globe, Home, LogOut, Menu, X, Search, Settings, LayoutDashboard, Mail, Heart } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
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

  const switchLocale = locale === "ar" ? "en" : "ar";
  const switchPath = pathname.replace(`/${locale}`, `/${switchLocale}`);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, closeMenu]);

  const navLinks = [
    { href: `/${locale}`, label: dict.common.home, icon: Home, prefetch: true },
    { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search, prefetch: true },
  ];

  if (userRole === ROLES.SUPER_ADMIN) {
    navLinks.push({ href: `/${locale}/admin`, label: dict.nav.dashboard, icon: Building2, prefetch: false });
  } else if (userRole === ROLES.OFFICE_ADMIN) {
    navLinks.push({ href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard, prefetch: false });
    navLinks.push({ href: `/${locale}/dashboard/contact-requests`, label: dict.nav.contactRequests, icon: Mail, prefetch: false });
    navLinks.push({ href: `/${locale}/dashboard/favorites`, label: dict.common.favorites || "المفضلة", icon: Heart, prefetch: false });
    navLinks.push({ href: `/${locale}/dashboard/settings`, label: dict.nav.settings, icon: Settings, prefetch: false });
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label={dict.common.mainNavigation}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2" prefetch aria-label={dict.common.home}>
            <Building2 className="w-8 h-8 text-blue-600" />
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
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <link.icon className="w-4 h-4" />
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
              aria-label={dict.nav?.switchLanguage || `Switch to ${switchLocale === "ar" ? "Arabic" : "English"}`}
            >
              <Globe className="w-4 h-4" />
              {dict.nav?.switchLanguage || (switchLocale === "ar" ? "عربي" : "EN")}
            </Link>

            {/* Login/Logout */}
            {userRole ? (
              <Link
                href={`/${locale}/logout`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{dict.common.logout}</span>
              </Link>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                prefetch
              >
                {dict.common.login}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? dict.common.close : dict.common.open}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-gray-200 bg-white transition-all duration-300 ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
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
              tabIndex={mobileMenuOpen ? 0 : -1}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

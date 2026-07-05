"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Settings,
  Tags,
  Users,
  Mail,
  BarChart3,
  Heart,
  UserCog,
  Bookmark,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import { ROLES, type UserRole } from "@/lib/utils/constants";

interface SidebarProps {
  locale: Locale;
  dict: Messages;
  role: UserRole;
  onNavigate?: () => void;
  profile?: { fullName?: string | null; email: string | null; avatarUrl?: string | null } | null;
}

export default function Sidebar({ locale, dict, role, onNavigate, profile }: SidebarProps) {
  const pathname = usePathname();

  const superAdminLinks = [
    { href: `/${locale}/admin`, label: dict.nav.dashboard, icon: LayoutDashboard },
    { href: `/${locale}/admin/analytics`, label: dict.admin.analytics, icon: BarChart3 },
    { href: `/${locale}/admin/offices`, label: dict.nav.offices, icon: Building2 },
    { href: `/${locale}/admin/users`, label: dict.admin.users, icon: UserCog },
    { href: `/${locale}/admin/zones`, label: dict.nav.zones, icon: MapPin },
    { href: `/${locale}/admin/property-types`, label: dict.nav.propertyTypes, icon: Tags },
    { href: `/${locale}/admin/contact-requests`, label: dict.nav.contactRequests, icon: Mail },
  ];

  const officeAdminLinks = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard },
    { href: `/${locale}/dashboard/properties`, label: dict.nav.myProperties, icon: Home },
    { href: `/${locale}/dashboard/properties/new`, label: dict.nav.addProperty, icon: Plus },
    { href: `/${locale}/dashboard/agents`, label: dict.nav.agents, icon: Users },
    { href: `/${locale}/dashboard/contact-requests`, label: dict.nav.contactRequests, icon: Mail },
    { href: `/${locale}/dashboard/favorites`, label: dict.common.favorites, icon: Heart },
    { href: `/${locale}/dashboard/saved-searches`, label: dict.dashboard?.savedSearches || "البحث المحفوظ", icon: Bookmark },
    { href: `/${locale}/dashboard/compare`, label: dict.dashboard?.compareProperties || "مقارنة العقارات", icon: GitCompare },
    { href: `/${locale}/dashboard/settings`, label: dict.nav.settings, icon: Settings },
    { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search },
  ];

  const officeAgentLinks = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard },
    { href: `/${locale}/dashboard/properties`, label: dict.nav.myProperties, icon: Home },
    { href: `/${locale}/dashboard/properties/new`, label: dict.nav.addProperty, icon: Plus },
    { href: `/${locale}/dashboard/contact-requests`, label: dict.nav.contactRequests, icon: Mail },
    { href: `/${locale}/dashboard/favorites`, label: dict.common.favorites, icon: Heart },
    { href: `/${locale}/dashboard/saved-searches`, label: dict.dashboard?.savedSearches || "البحث المحفوظ", icon: Bookmark },
    { href: `/${locale}/dashboard/compare`, label: dict.dashboard?.compareProperties || "مقارنة العقارات", icon: GitCompare },
    { href: `/${locale}/explore`, label: dict.nav.explore, icon: Search },
  ];

  const links = role === ROLES.SUPER_ADMIN ? superAdminLinks : role === ROLES.OFFICE_ADMIN ? officeAdminLinks : officeAgentLinks;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <div className="flex-1 py-4">
        {/* User Profile Section */}
        {profile && (
          <div className="px-4 pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName || profile.email || ""}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm ring-2 ring-gray-100">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : (profile.email || "").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.fullName || profile.email || ""}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email || ""}</p>
              </div>
            </div>
          </div>
        )}
        <nav className="px-3 space-y-1" role="navigation" aria-label={dict.common.sidebarNavigation}>
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${locale}/admin` && link.href !== `/${locale}/dashboard` && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <link.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ROLES, type UserRole, type Permission } from "@/lib/utils/constants";
import { hasPermission } from "@/lib/permissions";

interface AuthGuardProps {
  children: React.ReactNode;
  locale?: string;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
}

export default function AuthGuard({ children, locale: localeProp, requiredRole, requiredPermission }: AuthGuardProps) {
  const { user, profile, isLoading } = useAuthUser();
  const router = useRouter();
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || "ar";
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setRedirecting(true);
      router.push(`/${locale}/login`);
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      setRedirecting(true);
      if (profile?.role === ROLES.SUPER_ADMIN) {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
      return;
    }

    if (requiredPermission && !hasPermission(profile?.role as UserRole, requiredPermission)) {
      setRedirecting(true);
      if (profile?.role === ROLES.SUPER_ADMIN) {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
      return;
    }
  }, [user, profile, isLoading, requiredRole, requiredPermission, locale, router]);

  if (isLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && profile?.role !== requiredRole) return null;
  if (requiredPermission && !hasPermission(profile?.role as UserRole, requiredPermission)) return null;

  return <>{children}</>;
}

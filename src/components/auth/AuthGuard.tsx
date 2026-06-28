"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ROLES, type UserRole } from "@/lib/utils/constants";

interface AuthGuardProps {
  children: React.ReactNode;
  locale?: string;
  requiredRole?: UserRole;
}

export default function AuthGuard({ children, locale: localeProp, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuthUser();
  const router = useRouter();
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || "ar";

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      if (profile?.role === ROLES.SUPER_ADMIN) {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
      return;
    }
  }, [user, profile, loading, requiredRole, locale, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && profile?.role !== requiredRole) return null;

  return <>{children}</>;
}

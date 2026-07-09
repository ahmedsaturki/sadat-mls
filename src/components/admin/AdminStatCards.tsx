"use client";

import Link from "next/link";
import { Building2, Users, Home, MessageCircle } from "lucide-react";
import LuxuryStatCard from "@/components/ui/LuxuryStatCard";

type StatColor = "blue" | "green" | "purple" | "orange";

const iconMap = {
  Building2,
  Users,
  Home,
  MessageCircle,
} as const;

export type AdminStatIconKey = keyof typeof iconMap;

export interface AdminStatItem {
  iconKey: AdminStatIconKey;
  label: string;
  value: number;
  color: StatColor;
  href: string;
}

interface AdminStatCardsProps {
  stats: AdminStatItem[];
  locale?: string;
}

export default function AdminStatCards({ stats, locale = "ar" }: AdminStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.iconKey];
        return (
          <Link key={i} href={stat.href} aria-label={`${stat.label}: ${stat.value}`}>
            <LuxuryStatCard
              icon={Icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              locale={locale}
            />
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Building2, Users, Home, MessageCircle } from "lucide-react";
import LuxuryStatCard from "@/components/ui/LuxuryStatCard";

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  Home,
  MessageCircle,
};

interface StatItem {
  iconKey: string;
  label: string;
  value: number;
  color: string;
  href: string;
}

interface AdminStatCardsProps {
  stats: StatItem[];
}

export default function AdminStatCards({ stats }: AdminStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.iconKey];
        return (
          <Link key={i} href={stat.href}>
            <LuxuryStatCard
              icon={Icon}
              label={stat.label}
              value={stat.value}
              color={stat.color as "blue" | "green" | "purple" | "orange"}
            />
          </Link>
        );
      })}
    </div>
  );
}

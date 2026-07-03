import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuth } from "@/lib/supabase/server-auth";
import { isValidLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import { Building2, Users, Home, ArrowRight, BarChart3 } from "lucide-react";
import { ROLES } from "@/lib/utils/constants";

interface PropertyRecord {
  office_id: string;
  status: string;
}

interface OfficeRecord {
  id: string;
  name: string;
}

interface OfficeStats {
  id: string;
  name: string;
  propertiesCount: number;
  agentsCount: number;
  availableCount: number;
  soldCount: number;
  rentedCount: number;
}

export default async function AdminAnalyticsPage({
  params,
}: {
  params: { locale: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || "ar";

  if (!isValidLocale(locale)) {
    return null;
  }

  const dict = getMessages(locale);
  const { user, profile, supabase } = await getServerAuth();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (profile?.role !== ROLES.SUPER_ADMIN) {
    redirect(`/${locale}/dashboard`);
  }

  // Get all property data in one query to avoid N+1
  const [allPropertiesRes, officesRes, usersRes, agentsRes] = await Promise.all([
    supabase.from("properties").select("office_id, status"),
    supabase.from("offices").select("id, name, slug, is_active").order("name"),
    supabase.from("users").select("id, office_id, role"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", ROLES.OFFICE_AGENT),
  ]);

  const allProperties = allPropertiesRes.data || [];
  const allUsers = usersRes.data || [];
  const allOffices = officesRes.data || [];

// Aggregate stats from the single query result
  const availableCount = allProperties.filter((p: PropertyRecord) => p.status === "available").length;
  const soldCount = allProperties.filter((p: PropertyRecord) => p.status === "sold").length;
  const rentedCount = allProperties.filter((p: PropertyRecord) => p.status === "rented").length;

  // Count properties and agents per office using aggregation
  const officePropertyMap = new Map<string, { total: number; available: number; sold: number; rented: number }>();
  for (const prop of allProperties) {
    const current = officePropertyMap.get(prop.office_id) || { total: 0, available: 0, sold: 0, rented: 0 };
    current.total++;
    if (prop.status === "available") current.available++;
    else if (prop.status === "sold") current.sold++;
    else if (prop.status === "rented") current.rented++;
    officePropertyMap.set(prop.office_id, current);
  }

  const officeAgentMap = new Map<string, number>();
  for (const user of allUsers) {
    if (user.role === ROLES.OFFICE_AGENT) {
      officeAgentMap.set(user.office_id, (officeAgentMap.get(user.office_id) || 0) + 1);
    }
  }

  const officeStats = allOffices.map((office: OfficeRecord) => ({
    ...office,
    propertiesCount: officePropertyMap.get(office.id)?.total || 0,
    agentsCount: officeAgentMap.get(office.id) || 0,
    availableCount: officePropertyMap.get(office.id)?.available || 0,
    soldCount: officePropertyMap.get(office.id)?.sold || 0,
    rentedCount: officePropertyMap.get(office.id)?.rented || 0,
  }));

  const totalProperties = availableCount + soldCount + rentedCount;
  const totalUsers = allUsers.length;
  const totalAgents = agentsRes.count || 0;

  const statusCards = [
    { label: dict.admin.availableCount, value: availableCount, color: "bg-green-500" },
    { label: dict.admin.soldCount, value: soldCount, color: "bg-red-500" },
    { label: dict.admin.rentedCount, value: rentedCount, color: "bg-yellow-500" },
  ];

  const summaryCards = [
    { icon: Home, label: dict.admin.totalProperties, value: totalProperties, color: "blue" },
    { icon: Building2, label: dict.admin.totalOffices, value: allOffices.length, color: "purple" },
    { icon: Users, label: dict.admin.totalUsers, value: totalUsers, color: "green" },
    { icon: Users, label: dict.admin.agentsCount, value: totalAgents, color: "orange" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.admin.analyticsTitle}</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((stat, i) => (
            <Card key={i}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Property Status Breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <CardTitle>{dict.admin.propertiesByStatus}</CardTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statusCards.map((status, i) => {
              const pct = totalProperties > 0 ? Math.round((status.value / totalProperties) * 100) : 0;
              return (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className="text-sm font-medium text-gray-700">{status.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{status.value}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status.color} w-full`}
                      role="progressbar"
                      aria-valuenow={status.value}
                      aria-valuemin={0}
                      aria-valuemax={totalProperties}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Offices Summary */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <CardTitle>{dict.admin.officesSummary}</CardTitle>
            </div>
            <Link href={`/${locale}/admin/offices`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded transition-colors">
              {dict.landing.viewAll}
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
{officeStats.length > 0 ? (
             <div className="space-y-3">
               {officeStats.map((office: OfficeStats) => (
                <div key={office.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{office.name}</p>
                        <p className="text-xs text-gray-500">{dict.admin.agentsCount}: {office.agentsCount}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{office.propertiesCount} {dict.admin.propertiesCount}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {office.availableCount} {dict.admin.availableCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {office.soldCount} {dict.admin.soldCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      {office.rentedCount} {dict.admin.rentedCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">{dict.admin.noOffices}</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuth } from "@/lib/supabase/server-auth";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import { Building2, Users, Home, ArrowRight, BarChart3, TrendingUp, MapPin, Clock } from "lucide-react";
import { ROLES } from "@/lib/utils/constants";

interface PropertyRecord {
  office_id: string;
  status: string;
  price: number;
  area: number;
  zone_id: string | null;
  created_at: string;
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
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = (isValidLocale(resolvedParams.locale) ? resolvedParams.locale : "ar") as Locale;

  const dict = getMessages(locale);
  const { user, profile, supabase } = await getServerAuth();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (profile?.role !== ROLES.SUPER_ADMIN) {
    redirect(`/${locale}/dashboard`);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel queries
  const [
    allPropertiesRes,
    officesRes,
    usersRes,
    agentsRes,
    zonesRes,
    contactsRes,
    offersRes,
  ] = await Promise.all([
    supabase.from("properties").select("office_id, status, price, area, zone_id, created_at"),
    supabase.from("offices").select("id, name, slug, is_active").order("name"),
    supabase.from("users").select("id, office_id, role"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", ROLES.OFFICE_AGENT),
    supabase.from("zones").select("id, name_ar, name_en"),
    supabase.from("contact_requests").select("id, created_at"),
    supabase.from("property_offers").select("id, created_at"),
  ]);

  const allProperties = (allPropertiesRes.data || []) as PropertyRecord[];
  const allUsers = usersRes.data || [];
  const allOffices = officesRes.data || [];
  const zonesData = zonesRes.data || [];
  const allContacts = contactsRes.data || [];
  const allOffers = offersRes.data || [];

  // Zone name map
  const zoneMap = new Map(zonesData.map((z: { id: string; name_ar: string; name_en: string | null }) => [
    z.id,
    locale === "ar" ? z.name_ar : (z.name_en || z.name_ar),
  ]));

  // Aggregate stats
  const availableCount = allProperties.filter((p) => p.status === "available").length;
  const soldCount = allProperties.filter((p) => p.status === "sold").length;
  const rentedCount = allProperties.filter((p) => p.status === "rented").length;

  // Office stats
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
  for (const u of allUsers) {
    if (u.role === ROLES.OFFICE_AGENT && u.office_id) {
      officeAgentMap.set(u.office_id, (officeAgentMap.get(u.office_id) || 0) + 1);
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

  // ── Market Overview Calculations ──
  const totalMarketValue = allProperties.reduce((sum, p) => sum + (p.price || 0), 0);
  const avgPricePerSqm = allProperties.length > 0
    ? allProperties.reduce((sum, p) => sum + (p.area > 0 ? p.price / p.area : 0), 0) / allProperties.length
    : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(Math.round(price));

  // Price distribution
  const priceRanges = [
    { label: "< 500K", min: 0, max: 500000, count: 0 },
    { label: "500K - 1M", min: 500000, max: 1000000, count: 0 },
    { label: "1M - 2M", min: 1000000, max: 2000000, count: 0 },
    { label: "2M - 5M", min: 2000000, max: 5000000, count: 0 },
    { label: "5M+", min: 5000000, max: Infinity, count: 0 },
  ];
  for (const p of allProperties) {
    for (const range of priceRanges) {
      if (p.price >= range.min && p.price < range.max) {
        range.count++;
        break;
      }
    }
  }
  const maxRangeCount = Math.max(...priceRanges.map((r) => r.count), 1);

  // ── Zone Comparison ──
  const zoneStats = Array.from(zoneMap.entries()).map(([zoneId, zoneName]) => {
    const zoneProps = allProperties.filter((p) => p.zone_id === zoneId);
    return {
      name: zoneName,
      count: zoneProps.length,
      avgPrice: zoneProps.length > 0 ? zoneProps.reduce((s, p) => s + p.price, 0) / zoneProps.length : 0,
      avgPricePerSqm: zoneProps.length > 0 ? zoneProps.reduce((s, p) => s + (p.area > 0 ? p.price / p.area : 0), 0) / zoneProps.length : 0,
      avgArea: zoneProps.length > 0 ? zoneProps.reduce((s, p) => s + p.area, 0) / zoneProps.length : 0,
    };
  }).filter((z) => z.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);

  // ── Recent Activity ──
  const newProps7d = allProperties.filter((p) => p.created_at >= sevenDaysAgo).length;
  const newProps30d = allProperties.filter((p) => p.created_at >= thirtyDaysAgo).length;
  const newContacts7d = allContacts.filter((c) => c.created_at >= sevenDaysAgo).length;
  const newContacts30d = allContacts.filter((c) => c.created_at >= thirtyDaysAgo).length;
  const newOffers7d = allOffers.filter((o) => o.created_at >= sevenDaysAgo).length;
  const newOffers30d = allOffers.filter((o) => o.created_at >= thirtyDaysAgo).length;

  // ── UI Data ──
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

  const marketCards = [
    { label: dict.admin.totalMarketValue, value: formatPrice(totalMarketValue) + " EGP", color: "blue" },
    { label: dict.admin.avgPricePerSqm, value: formatPrice(avgPricePerSqm) + " EGP", color: "green" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-navy-100 text-navy-600",
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
                  <stat.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Market Overview */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
            <CardTitle>{dict.admin.marketOverview}</CardTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {marketCards.map((stat, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">{dict.admin.totalProperties}</p>
              <p className="text-xl font-bold text-gray-900">{totalProperties}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">{dict.admin.propertiesByStatus}</p>
              <p className="text-xl font-bold text-gray-900">{availableCount} / {soldCount} / {rentedCount}</p>
            </div>
          </div>

          {/* Price Distribution */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{dict.admin.priceDistribution}</h3>
          <div className="space-y-2">
            {priceRanges.map((range, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 text-end">{range.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-navy-400 rounded-full"
                    style={{ width: `${maxRangeCount > 0 ? (range.count / maxRangeCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-8">{range.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Property Status Breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-500" aria-hidden="true" />
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

        {/* Zone Comparison */}
        {zoneStats.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-gray-500" aria-hidden="true" />
              <CardTitle>{dict.admin.zoneComparison}</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start py-3 px-4 font-medium text-gray-500">{dict.admin.zoneName}</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">{dict.admin.propertyCount}</th>
                    <th className="text-end py-3 px-4 font-medium text-gray-500">{dict.admin.avgPrice}</th>
                    <th className="text-end py-3 px-4 font-medium text-gray-500">{dict.admin.avgPricePerSqm}</th>
                    <th className="text-end py-3 px-4 font-medium text-gray-500">{dict.admin.avgArea}</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneStats.map((zone, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{zone.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
                          {zone.count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end text-gray-700">{formatPrice(zone.avgPrice)} EGP</td>
                      <td className="py-3 px-4 text-end text-gray-700">{formatPrice(zone.avgPricePerSqm)} EGP</td>
                      <td className="py-3 px-4 text-end text-gray-700">{Math.round(zone.avgArea)} m²</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gray-500" aria-hidden="true" />
            <CardTitle>{dict.admin.recentActivity}</CardTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-3">{dict.admin.totalProperties}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newProperties7d}</span>
                  <span className="font-semibold text-gray-900">{newProps7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newProperties30d}</span>
                  <span className="font-semibold text-gray-900">{newProps30d}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-3">{dict.admin.contactRequests}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newContacts7d}</span>
                  <span className="font-semibold text-gray-900">{newContacts7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newContacts30d}</span>
                  <span className="font-semibold text-gray-900">{newContacts30d}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-3">{dict.dashboard.offers}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newOffers7d}</span>
                  <span className="font-semibold text-gray-900">{newOffers7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{dict.admin.newOffers30d}</span>
                  <span className="font-semibold text-gray-900">{newOffers30d}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Offices Summary */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" aria-hidden="true" />
              <CardTitle>{dict.admin.officesSummary}</CardTitle>
            </div>
            <Link href={`/${locale}/admin/offices`} className="text-sm text-navy-600 hover:text-navy-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded transition-colors">
              {dict.landing.viewAll}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          {officeStats.length > 0 ? (
            <div className="space-y-3">
              {officeStats.map((office: OfficeStats) => (
                <div key={office.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-navy-600" aria-hidden="true" />
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

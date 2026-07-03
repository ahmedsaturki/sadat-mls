import { redirect } from "next/navigation";
import Link from "next/link";
import { isValidLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import AdminStatCards from "@/components/admin/AdminStatCards";
import { Building2, MapPin, Plus, Home } from "lucide-react";
import { ROLES } from "@/lib/utils/constants";
import { getServerAuth } from "@/lib/supabase/server-auth";

interface RecentOffice {
  id: string;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface RecentContact {
  id: string;
  visitor_name: string | null;
  contact_type: string;
  status: string;
  created_at: string;
}

export default async function AdminDashboard({
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

  // Get stats
  const [officesCount, usersCount, propertiesCount, contactCount] = await Promise.all([
    supabase.from("offices").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("contact_requests").select("id", { count: "exact", head: true }),
  ]);

  // Get recent offices
  const { data: recentOffices } = await supabase
    .from("offices")
    .select("id, name, slug, email, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get recent contact requests
  const { data: recentContacts } = await supabase
    .from("contact_requests")
    .select("id, property_id, visitor_name, contact_type, status, created_at, properties(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      iconKey: "Building2",
      label: dict.admin.totalOffices,
      value: officesCount.count || 0,
      color: "blue",
      href: `/${locale}/admin/offices`,
    },
    {
      iconKey: "Users",
      label: dict.admin.totalUsers,
      value: usersCount.count || 0,
      color: "green",
      href: `/${locale}/admin/offices`,
    },
    {
      iconKey: "Home",
      label: dict.admin.totalProperties,
      value: propertiesCount.count || 0,
      color: "purple",
      href: `/${locale}/explore`,
    },
    {
      iconKey: "MessageCircle",
      label: dict.admin.contactRequests,
      value: contactCount.count || 0,
      color: "orange",
      href: `/${locale}/admin/contact-requests`,
    },
  ];

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.admin.dashboard}</h1>
          {profile?.full_name && (
            <p className="text-gray-500 mt-1">{dict.common.welcome} {profile.full_name} 👋</p>
          )}
        </div>

        {/* Stats */}
        <AdminStatCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Offices */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{dict.admin.recentOffices}</CardTitle>
              <Link href={`/${locale}/admin/offices`} className="text-sm text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded transition-colors">
                {dict.landing.viewAll} →
              </Link>
            </div>
            <div>
              {recentOffices && recentOffices.length > 0 ? (
                <div className="space-y-3">
                  {recentOffices.map((office: RecentOffice) => (
                    <div key={office.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{office.name}</p>
                          <p className="text-sm text-gray-500">{office.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(office.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">{dict.common.noData}</p>
              )}
            </div>
          </Card>

          {/* Recent Contact Requests */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{dict.contactRequests.title}</CardTitle>
              <Link href={`/${locale}/admin/contact-requests`} className="text-sm text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded transition-colors">
                {dict.landing.viewAll} →
              </Link>
            </div>
            <div>
              {recentContacts && recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact: RecentContact) => (
                    <div key={contact.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{contact.visitor_name}</p>
<p className="text-sm text-gray-500">
                             {contact.contact_type === "whatsapp" ? dict.contactRequests.whatsapp : contact.contact_type}
                           </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(contact.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">{dict.common.noData}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardTitle>{dict.admin.quickActions}</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href={`/${locale}/admin/offices`}
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">{dict.admin.addOffice}</span>
            </Link>
            <Link
              href={`/${locale}/admin/zones`}
              className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <MapPin className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">{dict.admin.manageZones}</span>
            </Link>
            <Link
              href={`/${locale}/admin/property-types`}
              className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <Home className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">{dict.admin.managePropertyTypes}</span>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

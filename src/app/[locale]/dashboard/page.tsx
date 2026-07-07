import { isValidLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import PropertyCard from "@/components/properties/PropertyCard";
import { Home, Plus, Users, Mail } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ROLES, type UserRole, type PropertyStatus } from "@/lib/utils/constants";
import { getServerAuth } from "@/lib/supabase/server-auth";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

interface PropertyImage {
  property_id: string;
  url: string;
}

interface PropertyRecord {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  primaryImage: string | null;
  zones?: { name_ar: string };
  property_types?: { name_ar: string };
  image_url?: string;
  office_id?: string;
}

interface ContactRecord {
  id: string;
  visitor_name: string | null;
  contact_type: string;
  created_at: string;
  properties?: { title: string };
}

export default async function OfficeDashboard({
  params,
}: {
  params: { locale: string };
}) {
  const resolvedParams = params;
  const locale = resolvedParams?.locale || "ar";

  if (!isValidLocale(locale)) {
    return null;
  }

  const dict = getMessages(locale);
  const { user, profile, supabase } = await getServerAuth();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!profile?.office_id) {
    redirect(`/${locale}/explore`);
  }

  const userRole = (profile.role as UserRole) || ROLES.OFFICE_AGENT;

  // Get all dashboard data in parallel
  const [
    propertiesCountResult,
    availableCountResult,
    contactRequestsCountResult,
    recentPropertiesResult,
    officeResult,
    agentsCountResult,
    recentContactsResult,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("office_id", profile.office_id),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("office_id", profile.office_id)
      .eq("status", "available"),
    supabase
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("office_id", profile.office_id),
    supabase
      .from("properties")
      .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, status, is_active, created_at, property_types(name_ar), zones(name_ar)")
      .eq("office_id", profile.office_id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("offices")
      .select("name")
      .eq("id", profile.office_id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("office_id", profile.office_id)
      .eq("role", ROLES.OFFICE_AGENT),
    supabase
      .from("contact_requests")
      .select("id, office_id, property_id, visitor_name, visitor_email, visitor_phone, contact_type, message, created_at, properties(title)")
      .eq("office_id", profile.office_id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const propertiesCount = propertiesCountResult;
  const availableCount = availableCountResult;
  const contactRequestsCount = contactRequestsCountResult;
  const { data: recentProperties } = recentPropertiesResult;
  const { data: office } = officeResult;
  const agentsCount = agentsCountResult.count;
  const { data: recentContacts } = recentContactsResult;

  // Fetch primary images for recent properties (in parallel with above if possible)
  const propertyIds = recentProperties?.map((p: PropertyRecord) => p.id) || [];
  const { data: propertyImages } = propertyIds.length > 0
    ? await supabase
        .from("property_images")
        .select("property_id, url")
        .in("property_id", propertyIds)
        .eq("is_primary", true)
    : { data: null };

const imageMap = new Map(propertyImages?.map((img: PropertyImage) => [img.property_id, img.url]) || []);
    const propertiesWithImages: PropertyRecord[] = (recentProperties || []).map((p: PropertyRecord) => ({
      ...p,
      status: p.status as PropertyStatus,
      primaryImage: imageMap.get(p.id) || null,
    }));

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dict.office.dashboard}</h1>
            <p className="text-gray-500 mt-1">
              {dict.common.welcome} {profile?.full_name || office?.name} 👋
            </p>
          </div>
          <Link href={`/${locale}/dashboard/properties/new`}>
            <Button>
              <Plus className="w-4 h-4 ms-2" />
              {dict.office.addProperty}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/${locale}/dashboard/properties`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{propertiesCount.count || 0}</p>
                  <p className="text-sm text-gray-500">{dict.office.myProperties}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href={`/${locale}/dashboard/properties`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{availableCount.count || 0}</p>
                  <p className="text-sm text-gray-500">{dict.office.available}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href={`/${locale}/dashboard/agents`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{agentsCount || 0}</p>
                  <p className="text-sm text-gray-500">{dict.office.manageAgents}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href={`/${locale}/dashboard/contact-requests`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{contactRequestsCount.count || 0}</p>
                  <p className="text-sm text-gray-500">{dict.nav.contactRequests}</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contact Requests */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{dict.contactRequests.title}</CardTitle>
              <Link href={`/${locale}/dashboard/contact-requests`} className="text-sm text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
                {dict.landing.viewAll} →
              </Link>
            </div>
            <div>
              {recentContacts && recentContacts.length > 0 ? (
                <div className="space-y-3">
                  {recentContacts.map((contact: ContactRecord) => (
                    <div key={contact.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{contact.visitor_name}</p>
                          <p className="text-sm text-gray-500">
                            {contact.contact_type === "whatsapp" ? dict.contactRequests.whatsapp : contact.contact_type === "phone" ? dict.contactRequests.phone : dict.contactRequests.email}
                            {contact.properties?.title ? ` — ${contact.properties.title}` : ""}
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
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-orange-400" />
                  </div>
                  <p className="text-gray-500 text-sm">{dict.contactRequests.noRequests}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{dict.office?.recentActivity || "Recent Activity"}</CardTitle>
            </div>
            <ActivityFeed locale={locale} dict={dict} officeId={profile.office_id} />
          </Card>
        </div>

        {/* Recent Properties */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{dict.office.myProperties}</h2>
            <Link href={`/${locale}/dashboard/properties`} className="text-sm text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
              {dict.landing.viewAll} →
            </Link>
          </div>
{propertiesWithImages && propertiesWithImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{propertiesWithImages.map((property: PropertyRecord) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    price={property.price}
                    area={property.area}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    zone={property.zones?.name_ar}
                    imageUrl={property.primaryImage || undefined}
                    status={property.status}
                    officeName={office?.name || ""}
                    locale={locale}
                    type={property.property_types?.name_ar}
                    dict={dict}
                    userId={user?.id || null}
                  />
                ))}
             </div>
          ) : (
            <Card>
<div className="text-center py-8">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Home className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-gray-500 mb-2">{dict.office.noPropertiesYet}</p>
                      <Link href={`/${locale}/dashboard/properties/new`} className="text-sm text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
                        {dict.office.addProperty} ←
                      </Link>
                    </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

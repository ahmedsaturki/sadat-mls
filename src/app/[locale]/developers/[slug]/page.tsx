import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { Building2, Globe, Phone, Mail, Briefcase, Home, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!developer) return { title: "Not Found" };

  return {
    title: developer.name,
    description: developer.description || `${developer.name} - ${isArabic(locale) ? "مطور عقاري" : "Real Estate Developer"}`,
    openGraph: {
      title: developer.name,
      description: developer.description || "",
      type: "profile",
      locale: isArabic(locale) ? "ar_EG" : "en_US",
    },
  };
}

function isArabic(locale: Locale) {
  return locale === "ar";
}

function formatPrice(price: number | null, locale: Locale) {
  if (!price) return null;
  return new Intl.NumberFormat(isArabic(locale) ? "ar-EG" : "en-US").format(price) + " EGP";
}

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!developer) notFound();

  // Fetch projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, status, min_price, max_price, min_area, max_area, delivery_date, cover_image_url, zone_id, zones(name_ar, name_en)")
    .eq("developer_id", developer.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fetch properties linked to this developer's projects
  const projectIds = (projects || []).map((p: { id: string }) => p.id);
  let properties: Array<Record<string, unknown>> = [];
  if (projectIds.length > 0) {
    const { data: propLinks } = await supabase
      .from("property_projects")
      .select("property_id")
      .in("project_id", projectIds);

    const propertyIds = (propLinks || []).map((l: { property_id: string }) => l.property_id);
    if (propertyIds.length > 0) {
      const { data: propsData } = await supabase
        .from("properties")
        .select("id, title, price, area, bedrooms, bathrooms, status, property_types(name_ar, name_en), zones(name_ar, name_en)")
        .in("id", propertyIds)
        .eq("status", "available")
        .limit(12);

      // Fetch primary images
      const propIds = (propsData || []).map((p: { id: string }) => p.id);
      let imageMap = new Map<string, string>();
      if (propIds.length > 0) {
        const { data: images } = await supabase
          .from("property_images")
          .select("property_id, url")
          .in("property_id", propIds)
          .eq("is_primary", true);
        imageMap = new Map((images || []).map((img: { property_id: string; url: string }) => [img.property_id, img.url]));
      }

      properties = (propsData || []).map((p: Record<string, unknown>) => ({
        ...p,
        primaryImage: imageMap.get(p.id as string) || null,
      }));
    }
  }

  // Stats
  const projectCount = (projects || []).length;
  const deliveredCount = (projects || []).filter((p: { status: string }) => p.status === "delivered").length;
  const underConstructionCount = (projects || []).filter((p: { status: string }) => p.status === "under_construction").length;
  const upcomingCount = (projects || []).filter((p: { status: string }) => p.status === "upcoming").length;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      upcoming: dict.admin.statusUpcoming,
      under_construction: dict.admin.statusUnderConstruction,
      delivered: dict.admin.statusDelivered,
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      under_construction: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Developer Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {developer.logo_url ? (
              <img src={developer.logo_url} alt={developer.name} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg" />
            ) : (
              <div className="w-20 h-20 bg-navy-100 dark:bg-navy-900/30 rounded-2xl flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
                <Building2 className="w-10 h-10 text-navy-600 dark:text-navy-400" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{developer.name}</h1>
              {developer.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">{developer.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {developer.email && (
                  <a href={`mailto:${developer.email}`} className="flex items-center gap-1 hover:text-navy-600 dark:hover:text-navy-400 transition-colors">
                    <Mail className="w-4 h-4" />{developer.email}
                  </a>
                )}
                {developer.phone && (
                  <a href={`tel:${developer.phone}`} className="flex items-center gap-1 hover:text-navy-600 dark:hover:text-navy-400 transition-colors">
                    <Phone className="w-4 h-4" />{developer.phone}
                  </a>
                )}
                {developer.website && (
                  <a href={developer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-navy-600 dark:text-navy-400 hover:underline">
                    <Globe className="w-4 h-4" />{developer.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-navy-100 dark:bg-navy-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-5 h-5 text-navy-600 dark:text-navy-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projectCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{dict.nav.projects}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{upcomingCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{dict.admin.statusUpcoming}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{underConstructionCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{dict.admin.statusUnderConstruction}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deliveredCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{dict.admin.statusDelivered}</div>
          </div>
        </div>

        {/* Projects */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          {dict.nav.projects}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({projectCount})</span>
        </h2>
        {(!projects || projects.length === 0) ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">{dict.common.noData}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {projects.map((proj: Record<string, unknown>) => {
              const zones = proj.zones as Record<string, string> | null;
              return (
                <Link
                  key={proj.id as string}
                  href={`/${locale}/projects/${proj.slug}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/50 transition-all"
                >
                  {proj.cover_image_url ? (
                    <img src={proj.cover_image_url as string} alt={proj.title as string} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{proj.title as string}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(proj.status as string)}`}>
                        {statusLabel(proj.status as string)}
                      </span>
                      {zones && (
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {isArabic(locale) ? zones.name_ar : (zones.name_en || zones.name_ar)}
                        </span>
                      )}
                    </div>
                    {(proj.min_price as number || proj.max_price as number) && (
                      <p className="text-navy-600 dark:text-navy-400 font-semibold mt-3">
                        {formatPrice(proj.min_price as number, locale)} - {formatPrice(proj.max_price as number, locale)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Properties from Projects */}
        {properties.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Home className="w-6 h-6" />
              {dict.nav.myProperties}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({properties.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id as string}
                  id={property.id as string}
                  title={property.title as string}
                  price={property.price as number}
                  area={property.area as number}
                  bedrooms={property.bedrooms as number}
                  bathrooms={property.bathrooms as number}
                  zone={isArabic(locale) ? (property.zones as Record<string, string>)?.name_ar : (property.zones as Record<string, string>)?.name_en}
                  imageUrl={(property as Record<string, unknown>).primaryImage as string || undefined}
                  status={property.status as "available" | "reserved" | "sold" | "rented" | "pending_review"}
                  officeName=""
                  locale={locale}
                  type={isArabic(locale) ? (property.property_types as Record<string, string>)?.name_ar : (property.property_types as Record<string, string>)?.name_en}
                  dict={dict}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Link from "next/link";
import { Building2, MapPin, Calendar, Ruler, DollarSign, Briefcase, Home, Phone, Mail } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, description, developers(name)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!project) return { title: "Not Found" };

  const isAr = locale === "ar";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devObj = Array.isArray(project.developers) ? (project.developers as any[])[0] : project.developers;
  const devName = devObj?.name || "";
  const desc = project.description
    ? `${project.description.substring(0, 150)}...`
    : `${project.title} - ${devName}`;

  return {
    title: project.title,
    description: desc,
    openGraph: {
      title: project.title,
      description: desc,
      type: "website",
      locale: isAr ? "ar_EG" : "en_US",
    },
  };
}

function formatPrice(price: number | null, locale: Locale) {
  if (!price) return null;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, developers(name, slug, email, phone, website), zones(name_ar, name_en)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!project) notFound();

  // Fetch properties linked to this project
  const { data: propLinks } = await supabase
    .from("property_projects")
    .select("property_id")
    .eq("project_id", project.id);

  const propertyIds = (propLinks || []).map((l: { property_id: string }) => l.property_id);
  let properties: Array<Record<string, unknown>> = [];

  if (propertyIds.length > 0) {
    const { data: propsData } = await supabase
      .from("properties")
      .select("id, title, price, area, bedrooms, bathrooms, status, property_types(name_ar, name_en), zones(name_ar, name_en)")
      .in("id", propertyIds)
      .order("created_at", { ascending: false });

    // Fetch primary images
    const { data: images } = await supabase
      .from("property_images")
      .select("property_id, url")
      .in("property_id", propertyIds)
      .eq("is_primary", true);

    const imageMap = new Map(
      (images || []).map((img: { property_id: string; url: string }) => [img.property_id, img.url])
    );

    properties = (propsData || []).map((p: Record<string, unknown>) => ({
      ...p,
      primaryImage: imageMap.get(p.id as string) || null,
    }));
  }

  // Status helpers
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

  // Developer info
  const developer = project.developers as Record<string, unknown> | null;
  const devName = developer?.name as string || "";
  const devSlug = developer?.slug as string || "";

  // Zone info
  const zones = project.zones as Record<string, string> | null;
  const zoneName = locale === "ar" ? zones?.name_ar : (zones?.name_en || zones?.name_ar);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Project Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt={project.title} className="w-full h-64 sm:h-80 object-cover" />
          ) : (
            <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-navy-100 to-navy-200 dark:from-navy-900/30 dark:to-navy-800/30 flex items-center justify-center">
              <Briefcase className="w-20 h-20 text-navy-300 dark:text-navy-700" />
            </div>
          )}
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor(project.status)}`}>
                {statusLabel(project.status)}
              </span>
            </div>

            {devName && (
              <Link
                href={`/${locale}/developers/${devSlug}`}
                className="inline-flex items-center gap-2 text-navy-600 dark:text-navy-400 hover:underline mb-4"
              >
                <Building2 className="w-4 h-4" />
                {devName}
              </Link>
            )}

            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed max-w-3xl">{project.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Properties */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              {dict.nav.myProperties}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({properties.length})</span>
            </h2>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id as string}
                    id={property.id as string}
                    title={property.title as string}
                    price={property.price as number}
                    area={property.area as number}
                    bedrooms={property.bedrooms as number}
                    bathrooms={property.bathrooms as number}
                    zone={locale === "ar" ? (property.zones as Record<string, string>)?.name_ar : (property.zones as Record<string, string>)?.name_en}
                    imageUrl={(property as Record<string, unknown>).primaryImage as string || undefined}
                    status={property.status as "available" | "reserved" | "sold" | "rented" | "pending_review"}
                    officeName=""
                    locale={locale}
                    type={locale === "ar" ? (property.property_types as Record<string, string>)?.name_ar : (property.property_types as Record<string, string>)?.name_en}
                    dict={dict}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                <Home className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{dict.common.noData}</p>
              </div>
            )}
          </div>

          {/* Sidebar: Project Info + Developer */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{dict.common.details}</h2>
              <div className="space-y-4">
                {zoneName && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{zoneName}</span>
                  </div>
                )}
                {project.delivery_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{dict.admin.projectDelivery}: {new Date(project.delivery_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                  </div>
                )}
                {(project.min_area || project.max_area) && (
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{project.min_area} - {project.max_area} m²</span>
                  </div>
                )}
                {(project.min_price || project.max_price) && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-navy-600 dark:text-navy-400 font-semibold">{formatPrice(project.min_price, locale)} - {formatPrice(project.max_price, locale)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Developer Info */}
            {developer && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{dict.admin.projectDeveloper}</h2>
                <Link
                  href={`/${locale}/developers/${devSlug}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-navy-100 dark:bg-navy-900/30 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-navy-600 dark:text-navy-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{devName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{dict.common.details}</p>
                  </div>
                </Link>
                {typeof developer.email === "string" && developer.email && (
                  <a href={`mailto:${developer.email}`} className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-navy-600 dark:hover:text-navy-400">
                    <Mail className="w-4 h-4" />{developer.email}
                  </a>
                )}
                {typeof developer.phone === "string" && developer.phone && (
                  <a href={`tel:${developer.phone}`} className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-navy-600 dark:hover:text-navy-400">
                    <Phone className="w-4 h-4" />{developer.phone}
                  </a>
                )}
              </div>
            )}

            {/* Property Count */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="text-3xl font-bold text-navy-600 dark:text-navy-400 mb-1">{properties.length}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{dict.nav.myProperties}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

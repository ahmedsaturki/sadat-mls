import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Building2, MapPin, Calendar, Ruler, DollarSign, Briefcase } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("title, description").eq("slug", slug).eq("is_active", true).single();
  if (!project) return { title: "Not Found" };
  return { title: project.title, description: project.description || "" };
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
    .select("*, developers(name, slug), zones(name_ar, name_en)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!project) notFound();

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
      upcoming: "bg-blue-100 text-blue-700",
      under_construction: "bg-yellow-100 text-yellow-700",
      delivered: "bg-green-100 text-green-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {project.cover_image_url && (
            <img src={project.cover_image_url} alt={project.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor(project.status)}`}>
                {statusLabel(project.status)}
              </span>
            </div>

            {project.developers && (
              <Link
                href={`/${locale}/developers/${project.developers.slug}`}
                className="inline-flex items-center gap-2 text-navy-600 hover:underline mb-4"
              >
                <Building2 className="w-4 h-4" />
                {project.developers.name}
              </Link>
            )}

            {project.description && (
              <p className="text-gray-600 mt-4 leading-relaxed">{project.description}</p>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{dict.common.details}</h2>
            <div className="space-y-4">
              {project.zones && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{locale === "ar" ? project.zones.name_ar : (project.zones.name_en || project.zones.name_ar)}</span>
                </div>
              )}
              {project.delivery_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{dict.admin.projectDelivery}: {new Date(project.delivery_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
              )}
              {(project.min_area || project.max_area) && (
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{project.min_area} - {project.max_area} m²</span>
                </div>
              )}
              {(project.min_price || project.max_price) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 font-semibold">{formatPrice(project.min_price)} - {formatPrice(project.max_price)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{dict.common.details}</h2>
            <p className="text-gray-500 text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              {dict.common.noData}
            </p>
          </div>
        </div>
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

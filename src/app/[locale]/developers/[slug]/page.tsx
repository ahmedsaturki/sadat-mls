import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Building2, Globe, Phone, Mail } from "lucide-react";
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
  const { data: developer } = await supabase.from("developers").select("name, description").eq("slug", slug).eq("is_active", true).single();
  if (!developer) return { title: "Not Found" };
  return {
    title: developer.name,
    description: developer.description || "",
  };
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

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, status, min_price, max_price, delivery_date, cover_image_url")
    .eq("developer_id", developer.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      upcoming: dict.admin.statusUpcoming,
      under_construction: dict.admin.statusUnderConstruction,
      delivered: dict.admin.statusDelivered,
    };
    return map[status] || status;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {developer.logo_url ? (
              <img src={developer.logo_url} alt={developer.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-navy-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{developer.name}</h1>
              {developer.description && (
                <p className="text-gray-600 mt-2">{developer.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {developer.email && (
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{developer.email}</span>
            )}
            {developer.phone && (
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{developer.phone}</span>
            )}
            {developer.website && (
              <a href={developer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-navy-600 hover:underline">
                <Globe className="w-4 h-4" />{developer.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{dict.nav.projects}</h2>
        {(!projects || projects.length === 0) ? (
          <p className="text-gray-500 text-center py-12">{dict.common.noData}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                href={`/${locale}/projects/${proj.slug}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                {proj.cover_image_url && (
                  <img src={proj.cover_image_url} alt={proj.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg">{proj.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-100 text-navy-700">
                      {statusLabel(proj.status)}
                    </span>
                    {proj.delivery_date && (
                      <span className="text-gray-500">
                        {dict.admin.projectDelivery}: {new Date(proj.delivery_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    )}
                  </div>
                  {(proj.min_price || proj.max_price) && (
                    <p className="text-navy-600 font-semibold mt-3">
                      {formatPrice(proj.min_price)} - {formatPrice(proj.max_price)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { MapPin, Building2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return { title: dict.cities.title };
}

export default async function CitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, name_en, slug, is_active")
    .eq("is_active", true)
    .order("name");

  // Get property counts per city
  const cityIds = (cities || []).map((c: { id: string }) => c.id);
  const propertyCounts: Record<string, number> = {};
  if (cityIds.length > 0) {
    const { data: props } = await supabase
      .from("properties")
      .select("city_id")
      .in("city_id", cityIds)
      .eq("is_active", true);
    (props || []).forEach((p: { city_id: string }) => {
      propertyCounts[p.city_id] = (propertyCounts[p.city_id] || 0) + 1;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.cities.title}</h1>
          <p className="text-gray-600 text-lg">{dict.cities.description}</p>
        </div>

        {(!cities || cities.length === 0) ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{dict.cities.noCities}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city: { id: string; name: string; name_en: string | null; slug: string }) => (
              <Link
                key={city.id}
                href={`/${locale}/${city.slug}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-navy-200 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-navy-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {locale === "ar" ? city.name : (city.name_en || city.name)}
                    </h3>
                    <p className="text-sm text-gray-500">{city.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{propertyCounts[city.id] || 0} {dict.cities.propertiesInCity}</span>
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

import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Shield, Users, TrendingUp, Home, MapPin, ArrowLeft } from "lucide-react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import LandingHero from "@/components/landing/LandingHero";
import ContactForm from "@/components/landing/ContactForm";
import { getLandingData } from "@/lib/queries/landing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale || "ar";
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  const isArabic = locale === "ar";

  return {
    title: dict.landing.hero,
    description: dict.landing.heroDescription,
    keywords: dict.nav.keywords,
    alternates: {
      canonical: isArabic ? "/ar" : "/en",
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      title: dict.landing.hero,
      description: dict.landing.heroDescription,
      type: "website",
      locale: isArabic ? "ar_EG" : "en_US",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale || "ar";
  const typedLocale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(typedLocale);
  const data = await getLandingData();

  const features = [
    { icon: Building2, title: dict.landing.benefits.sharedDatabase, desc: dict.landing.benefits.sharedDatabaseDesc },
    { icon: Shield, title: dict.landing.benefits.privacy, desc: dict.landing.benefits.privacyDesc },
    { icon: Users, title: dict.landing.benefits.easyToUse, desc: dict.landing.benefits.easyToUseDesc },
    { icon: TrendingUp, title: dict.landing.benefits.commission, desc: dict.landing.benefits.commissionDesc },
  ];

  return (
    <div className="min-h-screen bg-white">
      <a href="#landing-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={typedLocale} dict={dict} />
      <LandingHero locale={typedLocale} dict={dict} />

      <main id="landing-content" tabIndex={-1}>
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">{dict.landing.whySadatMLS}</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">{dict.landing.heroDescription}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label={dict.landing.whySadatMLS}>
              {features.map((feature, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-navy-50 transition-colors" role="listitem">
                  <div className="w-14 h-14 bg-navy-100 rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <feature.icon className="w-7 h-7 text-navy-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ContactForm dict={dict} />

        {data.properties.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">{dict.landing.featuredProperties}</h2>
                <Link href={`/${typedLocale}/explore`} className="text-navy-600 hover:text-navy-700 font-medium">
                  {dict.landing.viewAll} <ArrowLeft className="w-4 h-4 rtl:rotate-180 inline-block" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title ?? "Property"}
                    price={property.price}
                    area={property.area_m2}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    zone={[property.city, property.district, property.neighborhood].filter(Boolean).join(" · ") || null}
                    imageUrl={property.primaryImage || undefined}
                    status={property.status ?? "unknown"}
                    locale={typedLocale}
                    type={property.property_type}
                    dict={dict}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6 rounded-2xl bg-navy-50">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Building2 className="w-6 h-6 text-navy-600" aria-hidden="true" /></div>
                <div className="text-4xl font-bold text-navy-600 mb-2">{data.officesCount ?? "—"}</div>
                <div className="text-gray-600">{dict.landing.officesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-green-50">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Home className="w-6 h-6 text-green-600" aria-hidden="true" /></div>
                <div className="text-4xl font-bold text-green-600 mb-2">{data.propertiesCount}+</div>
                <div className="text-gray-600">{dict.landing.propertiesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-purple-50">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3"><MapPin className="w-6 h-6 text-purple-600" aria-hidden="true" /></div>
                <div className="text-4xl font-bold text-purple-600 mb-2">{data.zonesCount ?? "—"}</div>
                <div className="text-gray-600">{dict.landing.zonesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-orange-50">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-6 h-6 text-orange-600" aria-hidden="true" /></div>
                <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600">{dict.landing.alwaysAvailable}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-navy-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{dict.landing.ctaTitle}</h2>
            <p className="text-navy-100 mb-8 text-lg">{dict.landing.ctaDescription}</p>
            <Link href={`/${typedLocale}/login`} className="inline-flex items-center gap-2 bg-white text-navy-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-navy-50 transition-colors shadow-lg">
              {dict.common.login}
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={typedLocale} dict={dict} />
    </div>
  );
}

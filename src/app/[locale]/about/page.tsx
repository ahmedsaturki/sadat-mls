import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Shield, Users, TrendingUp, MapPin, ArrowLeft, Heart, Target, Eye } from "lucide-react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getLandingData } from "@/lib/queries/landing";

export const revalidate = 3600; // ISR: revalidate every 1 hour

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  const isArabic = locale === "ar";

  return {
    title: dict.about?.title || "About Sadat MLS",
    description: dict.about?.missionDesc || "Learn about Sadat MLS Cloud — the unified real estate platform for Sadat City.",
    alternates: {
      canonical: isArabic ? "/ar/about" : "/en/about",
      languages: {
        ar: "/ar/about",
        en: "/en/about",
      },
    },
    openGraph: {
      title: dict.about?.title || "About Sadat MLS",
      description: dict.about?.missionDesc || "Learn about Sadat MLS Cloud",
      type: "website",
      locale: isArabic ? "ar_EG" : "en_US",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const typedLocale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(typedLocale);
  const data = await getLandingData();

  const pillars = [
    {
      icon: Target,
      title: dict.about.mission,
      desc: dict.about.missionDesc,
      color: "navy",
    },
    {
      icon: Eye,
      title: dict.about.vision,
      desc: dict.about.visionDesc,
      color: "green",
    },
    {
      icon: Heart,
      title: dict.about.teamTitle,
      desc: dict.about.teamDesc,
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <a href="#about-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={typedLocale} dict={dict} />

      {/* Hero */}
      <section className="bg-navy-600 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-navy-200 mb-8" aria-label={dict.common.breadcrumb}>
            <Link href={`/${typedLocale}`} className="hover:text-white transition-colors">
              {dict.common.home}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">{dict.nav.about}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{dict.about.title}</h1>
          <p className="text-xl text-navy-100 max-w-2xl">{dict.about.missionDesc}</p>
        </div>
      </section>

      <main id="about-content" tabIndex={-1} className="focus:outline-none">
        {/* Mission, Vision, Community */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {pillars.map((pillar, i) => (
                <div key={i} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-navy-50 transition-colors">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 ${
                    pillar.color === "navy" ? "bg-navy-100" :
                    pillar.color === "green" ? "bg-green-100" :
                    "bg-purple-100"
                  }`}>
                    <pillar.icon className={`w-8 h-8 ${
                      pillar.color === "navy" ? "text-navy-600" :
                      pillar.color === "green" ? "text-green-600" :
                      "text-purple-600"
                    }`} aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{pillar.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{dict.about.statsTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6 rounded-2xl bg-white">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-navy-600" aria-hidden="true" />
                </div>
                <div className="text-4xl font-bold text-navy-600 mb-2">{data.officesCount}+</div>
                <div className="text-gray-600">{dict.landing.officesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">{data.propertiesCount}+</div>
                <div className="text-gray-600">{dict.landing.propertiesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">{data.zonesCount}</div>
                <div className="text-gray-600">{dict.landing.zonesCount}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-orange-600" aria-hidden="true" />
                </div>
                <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600">{dict.landing.alwaysAvailable}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-navy-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {dict.about.joinTitle}
            </h2>
            <p className="text-navy-100 mb-8 text-lg">
              {dict.about.joinDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${typedLocale}/explore`}
                className="inline-flex items-center justify-center gap-2 bg-white text-navy-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-navy-50 transition-colors shadow-lg"
              >
                {dict.nav.explore}
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </Link>
              <Link
                href={`/${typedLocale}/login`}
                className="inline-flex items-center justify-center gap-2 bg-navy-700 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-navy-800 transition-colors"
              >
                {dict.about.contactUs}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={typedLocale} dict={dict} />
    </div>
  );
}

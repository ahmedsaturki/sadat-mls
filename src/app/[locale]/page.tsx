import Link from "next/link";
import { Building2, Shield, Users, TrendingUp, Home, MapPin, Mail, ArrowLeft } from "lucide-react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import PropertyCard from "@/components/properties/PropertyCard";
import LandingHero from "@/components/landing/LandingHero";
import ContactForm from "@/components/landing/ContactForm";
import { getLandingData } from "@/lib/queries/landing";

export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: { locale: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const rawLocale = resolvedParams?.locale || "ar";
  const typedLocale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(typedLocale);
  const data = await getLandingData();

  const features = [
    {
      icon: Building2,
      title: dict.landing.benefits.sharedDatabase,
      desc: dict.landing.benefits.sharedDatabaseDesc,
    },
    {
      icon: Shield,
      title: dict.landing.benefits.privacy,
      desc: dict.landing.benefits.privacyDesc,
    },
    {
      icon: Users,
      title: dict.landing.benefits.easyToUse,
      desc: dict.landing.benefits.easyToUseDesc,
    },
    {
      icon: TrendingUp,
      title: dict.landing.benefits.commission,
      desc: dict.landing.benefits.commissionDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar locale={typedLocale} dict={dict} />

      <LandingHero locale={typedLocale} dict={dict} />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            {dict.landing.whySadatMLS}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {dict.landing.heroDescription}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-blue-600" />
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
              <Link href={`/${typedLocale}/explore`} className="text-blue-600 hover:text-blue-700 font-medium">
                {dict.landing.viewAll} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  area={property.area}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  zone={typedLocale === "ar" ? property.zones?.name_ar : property.zones?.name_en}
                  imageUrl={property.primaryImage || undefined}
                  status={property.status}
                  officeName={property.offices?.name || ""}
                  locale={typedLocale}
                  type={typedLocale === "ar" ? property.property_types?.name_ar : property.property_types?.name_en}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-blue-50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">{data.officesCount}+</div>
              <div className="text-gray-600">{dict.landing.officesCount}</div>
            </div>
            <div className="p-6 rounded-2xl bg-green-50">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">{data.propertiesCount}+</div>
              <div className="text-gray-600">{dict.landing.propertiesCount}</div>
            </div>
            <div className="p-6 rounded-2xl bg-purple-50">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">{data.zonesCount}</div>
              <div className="text-gray-600">{dict.landing.zonesCount}</div>
            </div>
            <div className="p-6 rounded-2xl bg-orange-50">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">{dict.landing.alwaysAvailable}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {dict.landing.ctaTitle}
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            {dict.landing.ctaDescription}
          </p>
          <Link
            href={`/${typedLocale}/login`}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            {dict.common.login}
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-semibold text-white">Sadat MLS Cloud</span>
              </div>
              <p className="text-sm leading-relaxed">{dict.footer.description}</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{dict.footer.quickLinks}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href={`/${typedLocale}`} className="hover:text-white transition-colors">{dict.common.home}</Link></li>
                <li><Link href={`/${typedLocale}/explore`} className="hover:text-white transition-colors">{dict.nav.explore}</Link></li>
                <li><Link href={`/${typedLocale}/login`} className="hover:text-white transition-colors">{dict.common.login}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{dict.footer.contactUs}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {dict.footer.location}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  info@sadatmls.com
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            © {new Date().getFullYear()} {dict.footer.sadatMLS}. {dict.footer.rights}.
          </div>
        </div>
      </footer>
    </div>
  );
}

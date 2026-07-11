import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/landing/ContactForm";

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
    title: dict.nav.contact,
    description: isArabic
      ? "تواصل معنا في مدينة السادات - نحن هنا لمساعدتك"
      : "Contact us in Sadat City - we are here to help",
    alternates: {
      canonical: isArabic ? "/ar/contact" : "/en/contact",
      languages: {
        ar: "/ar/contact",
        en: "/en/contact",
      },
    },
    openGraph: {
      title: dict.nav.contact,
      description: isArabic
        ? "تواصل معنا في مدينة السادات"
        : "Contact us in Sadat City",
      type: "website",
      locale: isArabic ? "ar_EG" : "en_US",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const typedLocale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(typedLocale);

  return (
    <div className="min-h-screen bg-white">
      <a href="#contact-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
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
            <span className="text-white font-medium">{dict.nav.contact}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{dict.nav.contact}</h1>
          <p className="text-xl text-navy-100 max-w-2xl">
            {typedLocale === "ar"
              ? "نحن هنا لمساعدتك. أرسل لنا رسالة وسنرد عليك في أقرب وقت."
              : "We are here to help. Send us a message and we will respond as soon as possible."}
          </p>
        </div>
      </section>

      <main id="contact-content" tabIndex={-1} className="focus:outline-none">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Contact info cards */}
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-navy-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{typedLocale === "ar" ? "البريد الإلكتروني" : "Email"}</p>
                  <p className="text-sm text-gray-600">info@sadatmls.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-green-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{typedLocale === "ar" ? "الهاتف" : "Phone"}</p>
                  <p className="text-sm text-gray-600">+20 (0) 100 000 0000</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-purple-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{typedLocale === "ar" ? "الموقع" : "Location"}</p>
                  <p className="text-sm text-gray-600">{typedLocale === "ar" ? "مدينة السادات، مصر" : "Sadat City, Egypt"}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto">
              <ContactForm dict={dict} />
            </div>
          </div>
        </section>
      </main>

      <Footer locale={typedLocale} dict={dict} />
    </div>
  );
}

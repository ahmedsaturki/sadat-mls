"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface LandingHeroProps {
  locale: Locale;
  dict: Messages;
}

export default function LandingHero({ locale, dict }: LandingHeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${locale}/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <section className="relative bg-brand-navy text-white overflow-hidden min-h-[90vh] flex items-center">
      {/* Luxury Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800" aria-hidden="true" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" aria-hidden="true" />

      {/* Golden Accents - responsive sizing to prevent mobile overflow */}
      <div
        className="animate-blob absolute top-0 end-0 w-48 sm:w-64 md:w-80 lg:w-[40rem] h-48 sm:h-64 md:h-80 lg:h-[40rem] bg-gold-400/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="animate-blob absolute bottom-0 start-0 w-48 sm:w-64 md:w-80 lg:w-[40rem] h-48 sm:h-64 md:h-80 lg:h-[40rem] bg-navy-400/5 rounded-full blur-[100px] pointer-events-none"
        style={{ animationDelay: "0.2s" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10 w-full">
        <div className="stagger text-center max-w-4xl mx-auto">
          <div className="animate-fade-up inline-flex items-center gap-2 bg-gold-400/10 text-gold-500 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-gold-400/20 shadow-[0_0_15px_rgba(196,154,42,0.15)]">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {dict.landing.heroBadge}
          </div>

          <h1 className="animate-fade-up text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-white drop-shadow-lg">
            {dict.landing.hero}
          </h1>

          <p className="animate-fade-up text-xl md:text-2xl text-gray-300 mb-6 font-light">
            {dict.landing.heroSubtitle}
          </p>

          <p className="animate-fade-up text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
            {dict.landing.heroDescription}
          </p>

          <form onSubmit={handleSearch} className="animate-scale-up max-w-2xl mx-auto mb-12">
            <div className="flex gap-2 p-2 rounded-2xl glass-luxury">
              <div className="flex-1 relative">
                <Search className="absolute start-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.landing.searchPlaceholder}
                  aria-label={dict.landing.searchPlaceholder}
                  className="w-full ps-14 pe-4 py-4 md:py-5 rounded-xl bg-white/5 text-white text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-800 transition-all placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                aria-label={dict.common.search}
                className="bg-gold-500 text-white px-8 py-4 md:py-5 rounded-xl font-semibold hover:bg-gold-600 transition-all shadow-lg hover:shadow-xl hover:shadow-gold-400/20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gold-500"
              >
                <Search className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="animate-fade-up flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center justify-center gap-2 glass-luxury text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-800"
            >
              <Home className="w-5 h-5" aria-hidden="true" />
              {dict.landing.viewAll}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center gap-2 bg-white text-navy-800 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {dict.common.login}
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none max-w-full" aria-hidden="true">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-full text-gray-50">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}

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
    <section className="relative bg-[#1B2D4F] text-white overflow-hidden min-h-[90vh] flex items-center">
      {/* Luxury Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B2D4F] via-[#152340] to-[#0D1526]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" aria-hidden="true" />

      {/* Golden Accents - responsive sizing to prevent mobile overflow */}
      <div
        className="animate-blob absolute top-0 right-0 w-48 sm:w-64 md:w-80 lg:w-[40rem] h-48 sm:h-64 md:h-80 lg:h-[40rem] bg-[#C49A2A]/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="animate-blob absolute bottom-0 left-0 w-48 sm:w-64 md:w-80 lg:w-[40rem] h-48 sm:h-64 md:h-80 lg:h-[40rem] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"
        style={{ animationDelay: "0.2s" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10 w-full">
        <div className="stagger text-center max-w-4xl mx-auto">
          <div className="animate-fade-up inline-flex items-center gap-2 bg-[#C49A2A]/10 text-[#C49A2A] px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-[#C49A2A]/20 shadow-[0_0_15px_rgba(196,154,42,0.15)]">
            <Sparkles className="w-4 h-4" />
            {dict.landing.heroBadge}
          </div>

          <h1 className="animate-fade-up text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-white drop-shadow-lg">
            {dict.landing.hero}
          </h1>

          <p className="animate-fade-up text-xl md:text-2xl text-gray-300 mb-6 font-light">
            {dict.landing.heroSubtitle}
          </p>

          <p className="animate-fade-up text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            {dict.landing.heroDescription}
          </p>

          <form onSubmit={handleSearch} className="animate-scale-up max-w-2xl mx-auto mb-12">
            <div className="flex gap-2 p-2 rounded-2xl glass-luxury">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.landing.searchPlaceholder}
                  aria-label={dict.landing.searchPlaceholder}
                  className="w-full pl-14 pr-4 py-4 md:py-5 rounded-xl bg-white/5 text-white text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B2D4F] transition-all placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                aria-label={dict.common.search}
                className="bg-[#C49A2A] text-white px-8 py-4 md:py-5 rounded-xl font-semibold hover:bg-[#b08924] transition-all shadow-lg hover:shadow-xl hover:shadow-[#C49A2A]/20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#C49A2A]"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>

          <div className="animate-fade-up flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center justify-center gap-2 glass-luxury text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B2D4F]"
            >
              <Home className="w-5 h-5" />
              {dict.landing.viewAll}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1B2D4F] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {dict.common.login}
              <ArrowLeft className="w-5 h-5" />
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

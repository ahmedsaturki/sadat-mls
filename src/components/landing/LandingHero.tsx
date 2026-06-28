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
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="w-4 h-4" />
            {dict.landing.heroBadge}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {dict.landing.hero}
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-6">{dict.landing.heroSubtitle}</p>
          <p className="text-lg text-blue-100 mb-10">{dict.landing.heroDescription}</p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.landing.searchPlaceholder}
                  aria-label={dict.landing.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
              </div>
              <button
                type="submit"
                aria-label="Search"
                className="bg-white text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              <Home className="w-5 h-5" />
              {dict.landing.viewAll}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              {dict.common.login}
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

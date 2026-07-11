"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface City {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
}

interface CitySelectorProps {
  locale: Locale;
  dict: Messages;
  currentCity?: string;
}

export default function CitySelector({ locale, dict, currentCity }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("cities")
          .select("id, name, name_en, slug")
          .eq("is_active", true)
          .order("name");

        if (data) setCities(data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || cities.length <= 1) return null;

  const currentCityData = cities.find((c) => c.slug === currentCity);
  const displayCity = currentCityData
    ? (locale === "ar" ? currentCityData.name : (currentCityData.name_en || currentCityData.name))
    : dict.nav.selectCity;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">{displayCity}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full end-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
          role="listbox"
          aria-label={dict.nav.selectCity}
        >
          {cities.map((city) => {
            const name = locale === "ar" ? city.name : (city.name_en || city.name);
            const isActive = city.slug === currentCity;
            return (
              <Link
                key={city.id}
                href={`/${locale}/${city.slug}`}
                onClick={() => setIsOpen(false)}
                role="option"
                aria-selected={isActive}
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-navy-50 text-navy-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {name}
                </span>
                {isActive && <Check className="w-4 h-4 text-navy-600" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { getMessages } from "@/i18n/getMessages";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Building2, Home, MapPin, Phone, Mail, Users, Calendar } from "lucide-react";
import { type Locale } from "@/i18n/config";

interface Office {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface OfficeProperty {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  property_types: { name_ar: string; name_en: string | null } | null;
  zones: { name_ar: string; name_en: string | null } | null;
  primaryImage?: string | null;
}

interface Agent {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface Props {
  locale: string;
  office: Office;
  properties: OfficeProperty[];
  agents: Agent[];
  totalCount: number;
}

export default function OfficeProfileClient({
  locale,
  office,
  properties,
  agents,
  totalCount,
}: Props) {
  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);
  const { user } = useAuthUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#office-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={typedLocale} dict={dict} />

      {/* Office Header */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8" id="office-content" tabIndex={-1}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {office.logo_url ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                <Image src={office.logo_url} alt={office.name} fill className="object-cover" sizes="80px" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-10 h-10 text-navy-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{office.name}</h1>
              {office.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{office.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {office.phone && (
                  <a href={`tel:${office.phone}`} className="flex items-center gap-1 hover:text-navy-600 transition-colors">
                    <Phone className="w-4 h-4" aria-hidden="true" />
                    {office.phone}
                  </a>
                )}
                {office.email && (
                  <a href={`mailto:${office.email}`} className="flex items-center gap-1 hover:text-navy-600 transition-colors">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    {office.email}
                  </a>
                )}
                {office.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    {office.address}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {typedLocale === "ar" ? "منذ" : "Since"} {new Date(office.created_at).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-navy-600">{totalCount}</div>
            <div className="text-sm text-gray-500">{typedLocale === "ar" ? "عقار" : "Properties"}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{properties.length}</div>
            <div className="text-sm text-gray-500">{typedLocale === "ar" ? "متاح" : "Available"}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">{agents.length}</div>
            <div className="text-sm text-gray-500">{typedLocale === "ar" ? "مندوب" : "Agents"}</div>
          </div>
        </div>

        {/* Agents */}
        {agents.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {typedLocale === "ar" ? "فريق العمل" : "Our Team"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  {agent.avatar_url ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
                      <Image src={agent.avatar_url} alt={agent.full_name || ""} fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-navy-600" />
                    </div>
                  )}
                  <p className="font-medium text-gray-900 text-sm">{agent.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{agent.role.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Properties */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            {dict.admin.officeProperties}
            <span className="text-sm font-normal text-gray-500">({properties.length})</span>
          </h2>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  area={property.area}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  zone={typedLocale === "ar" ? property.zones?.name_ar ?? undefined : property.zones?.name_en ?? undefined}
                  imageUrl={property.primaryImage || undefined}
                  status={property.status as "available" | "reserved" | "sold" | "rented"}
                  officeName={office.name}
                  locale={typedLocale}
                  type={typedLocale === "ar" ? property.property_types?.name_ar ?? undefined : property.property_types?.name_en ?? undefined}
                  dict={dict}
                  userId={user?.id || null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{dict.admin.noOfficeProperties}</p>
            </div>
          )}
        </section>
      </main>

      <Footer locale={typedLocale} dict={dict} />
    </div>
  );
}

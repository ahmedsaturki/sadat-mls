"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, User, Home, Phone, Mail, MessageCircle, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface Agent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  offices: { name: string; slug: string } | null;
}

interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  property_types: { name_ar: string; name_en: string } | null;
  zones: { name_ar: string; name_en: string } | null;
  primaryImage?: string | null;
}

interface AgentProfileClientProps {
  locale: Locale;
  dict: Messages;
  agent: Agent;
  properties: Property[];
  stats: { total: number; available: number; sold: number; rented: number };
}

export default function AgentProfileClient({
  locale,
  dict,
  agent,
  properties,
  stats,
}: AgentProfileClientProps) {
  const { user } = useAuthUser();

  const memberSince = new Date(agent.created_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "long" }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />

      {/* Agent Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {agent.avatar_url ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0">
                <Image
                  src={agent.avatar_url}
                  alt={agent.full_name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-navy-100 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg flex-shrink-0">
                <span className="text-2xl font-bold text-navy-600">
                  {agent.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{agent.full_name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {agent.offices && (
                  <Link
                    href={`/${locale}/offices/${agent.offices.slug}`}
                    className="flex items-center gap-1 hover:text-navy-600 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    {agent.offices.name}
                  </Link>
                )}
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="flex items-center gap-1 hover:text-navy-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {agent.phone}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dict.agents.memberSince} {memberSince}
                </span>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex gap-2">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  {dict.agents.callNow}
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  {dict.agents.sendEmail}
                </a>
              )}
              {agent.phone && (
                <a
                  href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  {dict.agents.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-navy-600">{stats.total}</div>
            <div className="text-sm text-gray-500">{dict.agents.totalProperties}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-500">{dict.agents.availableProperties}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.sold}</div>
            <div className="text-sm text-gray-500">{dict.agents.soldProperties}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{stats.rented}</div>
            <div className="text-sm text-gray-500">{dict.agents.rentedProperties}</div>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Home className="w-5 h-5" />
          {dict.agents.totalProperties}
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
                zone={locale === "ar" ? property.zones?.name_ar : property.zones?.name_en}
                imageUrl={property.primaryImage || undefined}
                status={property.status as "available" | "reserved" | "sold" | "rented" | "pending_review"}
                officeName={agent.offices?.name || ""}
                locale={locale}
                type={locale === "ar" ? property.property_types?.name_ar : property.property_types?.name_en}
                userId={user?.id || null}
                dict={dict}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{dict.agents.noPropertiesYet}</p>
          </div>
        )}
      </div>

      <Footer locale={locale} dict={dict} />
    </div>
  );
}

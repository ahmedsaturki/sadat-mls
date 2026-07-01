"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import Navbar from "@/components/layout/Navbar";
import PropertyCard from "@/components/properties/PropertyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Building2, User, Home } from "lucide-react";
import { ROLES } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";

interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  office_id: string;
  offices: { name: string; slug: string } | null;
}

interface AgentProperty {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: "available" | "reserved" | "sold" | "rented" | "pending_review";
  property_types: { name_ar: string; name_en: string } | null;
  zones: { name_ar: string; name_en: string } | null;
  primaryImage?: string | null;
}

function PublicAgentPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = usePageLocale(params);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuthUser();
  const mountedRef = useRef(true);

  const dict = getMessages(locale);
  const supabase = createClient();

  const loadAgent = useCallback(async (agentId: string) => {
    try {
      const { data: agentData } = await supabase
        .from("users")
        .select("*, offices(name, slug)")
        .eq("id", agentId)
        .eq("role", ROLES.OFFICE_AGENT)
        .maybeSingle();

      if (!agentData) {
        setNotFound(true);
        return;
      }

      setAgent(agentData);

      const { data: propsData } = await supabase
        .from("properties")
        .select("*, property_types(name_ar, name_en), zones(name_ar, name_en)")
        .eq("created_by", agentId)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(20);

      const propertyIds = (propsData || []).map((p: AgentProperty) => p.id);
      const { data: images } = propertyIds.length > 0
        ? await supabase
            .from("property_images")
            .select("property_id, url")
            .in("property_id", propertyIds)
            .eq("is_primary", true)
        : { data: null };

      const imageMap = new Map(images?.map((img: { property_id: string; url: string }) => [img.property_id, img.url]) || []);
      const withImages = (propsData || []).map((p: AgentProperty) => ({
        ...p,
        primaryImage: imageMap.get(p.id) || null,
      }));

      if (!mountedRef.current) return;
      setProperties(withImages);
    } catch (err) {
      logger.error("Failed to load agent", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;
    loadAgent(params.id);
    return () => { mountedRef.current = false; };
  }, [params, loadAgent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} dict={dict} />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} dict={dict} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {dict.contactRequests.agentNotFound}
            </h1>
            <p className="text-gray-500">
              {dict.contactRequests.agentNotFoundDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />

      {/* Agent Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agent.full_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {agent.offices && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {dict.contactRequests.agentOffice}: {agent.offices.name}
                  </span>
                )}
                {agent.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {agent.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Home className="w-5 h-5" />
          {dict.contactRequests.agentProperties}
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
                zone={
                  locale === "ar"
                    ? property.zones?.name_ar
                    : property.zones?.name_en
                }
                imageUrl={property.primaryImage || undefined}
                status={property.status}
                officeName={agent.offices?.name || ""}
                locale={locale}
                type={
                  locale === "ar"
                    ? property.property_types?.name_ar
                    : property.property_types?.name_en
                }
                userId={user?.id || null}
                dict={dict}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {dict.contactRequests.noAgentProperties}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentPageWrapper(props: { params: { locale: string; id: string } }) {
  return (
    <ErrorBoundary>
      <PublicAgentPage {...props} />
    </ErrorBoundary>
  );
}

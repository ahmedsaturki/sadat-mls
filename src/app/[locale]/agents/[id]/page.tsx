import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import AgentProfileClient from "@/components/agents/AgentProfileClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("users")
    .select("full_name, offices(name)")
    .eq("id", id)
    .eq("role", "office_agent")
    .maybeSingle();

  if (!agent) return { title: "Agent Not Found" };

  const officeName = Array.isArray(agent.offices) ? (agent.offices[0] as Record<string, unknown>)?.name || "" : (agent.offices as Record<string, unknown>)?.name || "";
  const description = officeName
    ? `${agent.full_name} - ${officeName}`
    : agent.full_name;

  return {
    title: agent.full_name,
    description,
    openGraph: {
      title: agent.full_name,
      description,
      type: "profile",
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  const supabase = await createClient();

  // Fetch agent
  const { data: agent } = await supabase
    .from("users")
    .select("id, email, full_name, phone, office_id, avatar_url, created_at, offices(name, slug)")
    .eq("id", id)
    .eq("role", "office_agent")
    .maybeSingle();

  if (!agent) notFound();

  // Fetch properties
  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, price, area, bedrooms, bathrooms, status, property_types(name_ar, name_en), zones(name_ar, name_en)")
    .eq("created_by", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch primary images
  const propertyIds = (properties || []).map((p: { id: string }) => p.id);
  let imageMap = new Map<string, string>();
  if (propertyIds.length > 0) {
    const { data: images } = await supabase
      .from("property_images")
      .select("property_id, url")
      .in("property_id", propertyIds)
      .eq("is_primary", true);
    imageMap = new Map(
      (images || []).map((img: { property_id: string; url: string }) => [img.property_id, img.url])
    );
  }

  // Fetch stats
  const { count: totalProperties } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id);

  const { count: availableCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id)
    .eq("status", "available");

  const { count: soldCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id)
    .eq("status", "sold");

  const { count: rentedCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id)
    .eq("status", "rented");

  const formattedProperties = (properties || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    title: p.title as string,
    price: p.price as number,
    area: p.area as number,
    bedrooms: p.bedrooms as number,
    bathrooms: p.bathrooms as number,
    status: p.status as string,
    property_types: p.property_types,
    zones: p.zones,
    primaryImage: imageMap.get(p.id as string) || null,
  }));

  // Flatten Supabase join results
  const agentOffices = agent.offices
    ? (Array.isArray(agent.offices) ? agent.offices[0] : agent.offices) as { name: string; slug: string } | null
    : null;

  return (
    <AgentProfileClient
      locale={locale}
      dict={dict}
      agent={{
        id: agent.id,
        full_name: agent.full_name || "",
        email: agent.email || "",
        phone: agent.phone || null,
        avatar_url: agent.avatar_url || null,
        created_at: agent.created_at || "",
        offices: agentOffices,
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties={formattedProperties as any}
      stats={{
        total: totalProperties || 0,
        available: availableCount || 0,
        sold: soldCount || 0,
        rented: rentedCount || 0,
      }}
    />
  );
}

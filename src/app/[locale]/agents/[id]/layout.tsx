import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/utils/constants";

interface Office {
  name: string;
  slug: string;
}

interface AgentData {
  full_name: string;
  avatar_url: string | null;
  offices: Office | Office[] | null;
}

interface PageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("users")
    .select("full_name, avatar_url, offices(name, slug)")
    .eq("id", id)
    .eq("role", ROLES.OFFICE_AGENT)
    .single<AgentData>();

  if (!agent) {
    return {
      title: dict.agents.agentNotFound,
    };
  }

  // Handle offices which can be an array or object
  let officeName = dict.agents.realEstateAgent;
  if (agent.offices) {
    if (Array.isArray(agent.offices) && agent.offices.length > 0) {
      officeName = agent.offices[0].name;
    } else if (!Array.isArray(agent.offices) && agent.offices.name) {
      officeName = agent.offices.name;
    }
  }

  const imageUrl = agent.avatar_url ? new URL(agent.avatar_url, baseUrl).toString() : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: agent.full_name,
    description: `${agent.full_name} - ${officeName} | ${dict.common.appName}`,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/agents/${id}`,
      languages: {
        "ar": `${baseUrl}/ar/agents/${id}`,
        "en": `${baseUrl}/en/agents/${id}`,
      },
    },
    openGraph: {
      type: "profile",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      siteName: dict.common.appName,
      title: agent.full_name,
      description: `${agent.full_name} - ${officeName}`,
      url: `${baseUrl}/${validLocale}/agents/${id}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 400,
          height: 400,
          alt: agent.full_name,
        },
      ] : [],
    },
    twitter: {
      card: "summary",
      title: agent.full_name,
      description: `${agent.full_name} - ${officeName}`,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
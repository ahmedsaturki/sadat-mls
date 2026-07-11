import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProjectsClient from "@/components/projects/ProjectsClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);
  return {
    title: dict.nav.projects,
    description: dict.landing.heroDescription,
    alternates: { canonical: `/${locale}/projects` },
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  const supabase = await createClient();
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, title, slug, status, min_price, max_price, min_area, max_area, delivery_date, cover_image_url, developer_id, developers(name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Flatten FK join — Supabase returns developers as array from join
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (rawProjects || []).map((p: any) => ({
    ...p,
    developers: Array.isArray(p.developers) ? (p.developers[0] || null) : p.developers,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{dict.nav.projects}</h1>
          <p className="text-gray-600 mt-2">{dict.landing.heroDescription}</p>
        </div>
        <ProjectsClient projects={projects || []} locale={locale} dict={dict} />
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

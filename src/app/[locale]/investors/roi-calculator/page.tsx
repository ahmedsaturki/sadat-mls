import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import ROICalculator from "@/components/investors/ROICalculator";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600;

type ROIProperty = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  "id" | "title" | "price" | "area_m2" | "bedrooms" | "bathrooms"
>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale || "ar";
  const locale = (isValidLocale(rawLocale) ? rawLocale : "ar") as Locale;
  const dict = getMessages(locale);

  return {
    title: dict.investor.roiCalculator,
    description: dict.investor.roiCalculatorDescription,
  };
}

export default async function ROICalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);

  const supabase = await createClient();

  const propertyQuery = supabase
    .from("properties")
    .select("id, title, price, area_m2, bedrooms, bathrooms")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50)
    .overrideTypes<ROIProperty[], { merge: false }>();

  const { data: properties, error } = await propertyQuery;
  if (error) throw error;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar locale={typedLocale} dict={dict} />
      <div className="pt-20">
        <ROICalculator
          locale={typedLocale}
          dict={dict}
          properties={(properties || []).map((p) => ({
            id: p.id,
            title: p.title ?? `Property ${p.id.slice(0, 8)}`,
            price: p.price ?? 0,
            area: p.area_m2 ?? 0,
            bedrooms: p.bedrooms ?? 0,
            bathrooms: p.bathrooms ?? 0,
          }))}
        />
      </div>
      <Footer locale={typedLocale} dict={dict} />
    </main>
  );
}

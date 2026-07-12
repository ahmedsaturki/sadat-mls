import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/server";
import ROICalculator from "@/components/investors/ROICalculator";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600;

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
  const isArabic = typedLocale === "ar";

  const supabase = await createClient();

  // Fetch available properties for the dropdown
  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, price, area, bedrooms, bathrooms, zone_id, property_type_id, property_types(name_ar, name_en), zones(name_ar, name_en)")
    .eq("status", "available")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar locale={typedLocale} dict={dict} />
      <div className="pt-20">
        <ROICalculator
          locale={typedLocale}
          dict={dict}
          properties={(properties || []).map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            area: p.area,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            zoneName: isArabic
              ? (p.zones as unknown as { name_ar: string })?.name_ar
              : (p.zones as unknown as { name_en: string })?.name_en,
            typeName: isArabic
              ? (p.property_types as unknown as { name_ar: string })?.name_ar
              : (p.property_types as unknown as { name_en: string })?.name_en,
          }))}
        />
      </div>
      <Footer locale={typedLocale} dict={dict} />
    </main>
  );
}

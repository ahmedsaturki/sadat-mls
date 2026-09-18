"use client";

import { Suspense, lazy } from "react";
import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Share2, ChevronLeft, DoorOpen, ParkingCircle, Accessibility } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { formatPrice } from "@/lib/utils/cn";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PropertyReportButton = lazy(() => import("@/components/properties/PropertyReportButton"));

type TransactionType = "sale" | "rent" | "both" | "unknown";
type PropertyStatus = "active" | "inactive" | "sold" | "rented" | "archived" | "unknown";

export interface AqaratPropertyDetail {
  id: string;
  title: string | null;
  description: string | null;
  property_type: string | null;
  transaction_type: TransactionType;
  status: PropertyStatus;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  finishing: string | null;
  price: number | null;
  currency: string | null;
  features: Record<string, unknown> | null;
  confidence: number | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  parcel_number: number | null;
  installments_clear: boolean | null;
  canonical_key: string | null;
}

interface PropertyDetailClientProps {
  locale: string;
  property: AqaratPropertyDetail;
}

function statusVariant(status: PropertyStatus): "success" | "danger" | "warning" {
  return status === "active" ? "success" : status === "sold" || status === "rented" ? "danger" : "warning";
}

function featureItems(property: AqaratPropertyDetail, dict: ReturnType<typeof getMessages>) {
  const features = property.features ?? {};
  const items = [
    { key: "has_balcony", icon: DoorOpen, label: dict.property.hasBalcony },
    { key: "has_parking", icon: ParkingCircle, label: dict.property.hasParking },
    { key: "has_elevator", icon: Accessibility, label: dict.property.hasElevator },
  ];
  return items.filter((item) => features[item.key] === true);
}

export default function PropertyDetailClient({ locale, property }: PropertyDetailClientProps) {
  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);
  const title = property.title ?? "Property";
  const location = [property.city, property.district, property.neighborhood].filter(Boolean).join(" · ");
  const features = featureItems(property, dict);
  const reportReady =
    property.price != null &&
    property.area_m2 != null &&
    property.bedrooms != null &&
    property.bathrooms != null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: property.description ?? undefined, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50" id="property-content">
      <a href="#property-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={typedLocale} dict={dict} />

      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label={dict.common.breadcrumb}>
            <Link href={`/${locale}`} className="hover:text-gray-900">{dict.common.home}</Link>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            <Link href={`/${locale}/explore`} className="hover:text-gray-900">{dict.nav.explore}</Link>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            <span className="text-gray-900 font-medium truncate max-w-[220px]">{title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center" role="img" aria-label="Property media unavailable">
              <Maximize className="w-16 h-16 text-gray-300" aria-hidden="true" />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {location && (
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span className="text-gray-500">{location}</span>
                    </div>
                  )}
                </div>
                <Badge variant={statusVariant(property.status)}>
                  {dict.property.status[property.status as keyof typeof dict.property.status] ?? property.status}
                </Badge>
              </div>

              <p className="text-3xl font-bold text-navy-600 mb-6">
                {property.price != null ? formatPrice(property.price) : "—"}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Maximize className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.area_m2 ?? "—"} {dict.property.areaUnit}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.bedrooms ?? 0} {dict.property.bedroom}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.bathrooms ?? 0} {dict.property.bathroom}</p>
                </div>
              </div>

              {features.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-900 mb-3">{dict.property.features}</h2>
                  <div className="flex flex-wrap gap-2">
                    {features.map(({ key, icon: Icon, label }) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.description && (
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-900 mb-2">{dict.property.description}</h2>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">{property.description}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
                {property.property_type && <p><span className="text-gray-500">{dict.property.typeLabel}: </span><span className="font-medium text-gray-900">{property.property_type}</span></p>}
                {property.floor && <p><span className="text-gray-500">{dict.property.floorsLabel}: </span><span className="font-medium text-gray-900">{property.floor}</span></p>}
                {property.finishing && <p><span className="text-gray-500">Finishing: </span><span className="font-medium text-gray-900">{property.finishing}</span></p>}
                {property.address && <p><span className="text-gray-500">{dict.common.address}: </span><span className="font-medium text-gray-900">{property.address}</span></p>}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              <Button className="w-full" variant="ghost" onClick={handleShare}>
                <Share2 className="w-4 h-4 ms-2" />
                {dict.property.share}
              </Button>
              {reportReady && (
                <Suspense fallback={null}>
                  <PropertyReportButton
                    property={{
                      title,
                      description: property.description ?? undefined,
                      price: property.price!,
                      area: property.area_m2!,
                      bedrooms: property.bedrooms!,
                      bathrooms: property.bathrooms!,
                      status: property.status,
                      zone: location || undefined,
                      type: property.property_type ?? undefined,
                    }}
                    locale={typedLocale}
                    dict={{ common: dict.common } as unknown as { common: Record<string, string> }}
                  />
                </Suspense>
              )}
            </div>
          </aside>
        </div>
      </div>

      <Footer locale={typedLocale} dict={dict} />
    </main>
  );
}

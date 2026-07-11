"use client";

import { useState, useCallback, Suspense, lazy } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Share2,
  ChevronLeft,
  Building2,
  ParkingCircle,
  Accessibility,
  DoorOpen,
} from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { formatPrice } from "@/lib/utils/cn";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthUser } from "@/hooks/useAuthUser";
import FavoriteButton from "@/components/properties/FavoriteButton";
import CompareButton from "@/components/properties/CompareButton";
import PropertyGallery from "@/components/properties/PropertyGallery";
import PropertyLightbox from "@/components/properties/PropertyLightbox";
import type { PropertyForComparison } from "@/hooks/useCompare";
import { sanitizeJsonLd } from "@/lib/security/sanitizeHtml";
import { logger } from "@/lib/logger";

const ContactModal = lazy(() => import("@/components/properties/ContactModal"));

interface PropertyData {
  id: string;
  title: string;
  description: string | null;
  property_type_id: string | null;
  zone_id: string | null;
  street: string | null;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors: number | null;
  has_balcony: boolean;
  has_parking: boolean;
  has_elevator: boolean;
  status: string;
  is_active: boolean;
  office_id: string;
  created_at: string;
  property_types: { name_ar: string; name_en: string | null } | null;
  zones: { name_ar: string; name_en: string | null } | null;
  offices: { name: string; phone: string; email: string } | null;
}

interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  file_path: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

interface PropertyDetailClientProps {
  locale: string;
  property: PropertyData;
  images: PropertyImage[];
}

export default function PropertyDetailClient({
  locale,
  property,
  images,
}: PropertyDetailClientProps) {
  const typedLocale = locale as Locale;
  const dict = getMessages(typedLocale);
  const { user } = useAuthUser();
  const userId = user?.id || null;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleContact = () => setShowContactModal(true);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `${property.title} - ${formatPrice(property.price)}`,
          url: window.location.href,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        logger.warn("Share failed", { error: err instanceof Error ? err.message : String(err) });
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (err) {
        logger.error("Copy failed", { error: err instanceof Error ? err.message : String(err) });
      }
    }
  };

  const navigateImage = useCallback((dir: "prev" | "next") => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) =>
      dir === "prev"
        ? prev === 0 ? images.length - 1 : prev - 1
        : prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    image: images.length > 0 ? images.map((img) => img.url) : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "EGP",
      availability: property.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.zones?.name_en || property.zones?.name_ar || undefined,
      addressCountry: "EG",
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    propertyType: property.property_types?.name_en || property.property_types?.name_ar || undefined,
    realEstateAgent: property.offices ? {
      "@type": "RealEstateAgent",
      name: property.offices.name,
      telephone: property.offices.phone || undefined,
      email: property.offices.email || undefined,
    } : undefined,
  };

  const sanitizedJsonLd = sanitizeJsonLd(jsonLd);

  const statusVariant =
    property.status === "available"
      ? "success"
      : property.status === "sold"
      ? "danger"
      : "warning";

  const features = [
    { show: property.has_balcony, icon: DoorOpen, label: dict.property.hasBalcony },
    { show: property.has_parking, icon: ParkingCircle, label: dict.property.hasParking },
    { show: property.has_elevator, icon: Accessibility, label: dict.property.hasElevator },
  ].filter((f) => f.show);

  return (
    <main className="min-h-screen bg-gray-50" id="property-content">
      <a href="#property-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
        {dict.common.skipToContent}
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizedJsonLd }}
      />
      <Navbar locale={typedLocale} dict={dict} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label={dict.common.breadcrumb}>
            <Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">
              {dict.common.home}
            </Link>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            <Link href={`/${locale}/explore`} className="hover:text-gray-900 transition-colors">
              {dict.nav.explore}
            </Link>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyGallery
              images={images}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              onOpenLightbox={() => setShowLightbox(true)}
              propertyTitle={property.title}
              dict={dict}
            />

            {/* Property Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    <span className="text-gray-500">{locale === "ar" ? property.zones?.name_ar : property.zones?.name_en}</span>
                  </div>
                </div>
                <Badge variant={statusVariant}>
                  {dict.property.status[property.status as keyof typeof dict.property.status]}
                </Badge>
              </div>

              <p className="text-3xl font-bold text-navy-600 mb-6">
                {formatPrice(property.price)}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Maximize className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.area} {dict.property.areaUnit}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.bedrooms} {dict.property.bedroom}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="w-5 h-5 text-gray-500 mx-auto mb-1" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{property.bathrooms} {dict.property.bathroom}</p>
                </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-900 mb-3">{dict.property.features}</h2>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        <feat.icon className="w-4 h-4" aria-hidden="true" />
                        {feat.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">{dict.property.description}</h2>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Property Type */}
              {property.property_types && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{dict.property.typeLabel}: </span>
                  <span className="font-medium text-gray-900">{locale === "ar" ? property.property_types?.name_ar : property.property_types?.name_en}</span>
                </div>
              )}

              {property.floors && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">{dict.property.floorsLabel}: </span>
                  <span className="font-medium text-gray-900">{property.floors}</span>
                </div>
              )}
              {property.street && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">{dict.property.streetLabel}: </span>
                  <span className="font-medium text-gray-900">{property.street}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              <div className="flex gap-2 mb-4">
                <Button className="flex-1" onClick={handleContact}>
                  <MessageCircle className="w-4 h-4 ms-2" />
                  {dict.property.whatsapp}
                </Button>
                <Button className="flex-1" variant="outline" onClick={handleContact}>
                  <Phone className="w-4 h-4 ms-2" />
                  {dict.property.call}
                </Button>
              </div>
              <Button className="w-full" variant="ghost" onClick={handleShare}>
                <Share2 className="w-4 h-4 ms-2" />
                {dict.property.share}
              </Button>
              <div className="mt-2 flex justify-center items-center gap-4">
                <CompareButton
                  property={property as unknown as PropertyForComparison}
                  locale={typedLocale}
                  dict={dict}
                />
                <FavoriteButton propertyId={property.id} userId={userId} locale={typedLocale} dict={dict} />
              </div>
            </div>

            {/* Office Info */}
            {property.offices && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">{dict.property.officeLabel}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-navy-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.offices.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {property.offices.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      <span>{property.offices.phone}</span>
                    </div>
                  )}
                  {property.offices.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                      <span>{property.offices.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer locale={typedLocale} dict={dict} />

      {/* Lightbox */}
      {showLightbox && images.length > 0 && (
        <PropertyLightbox
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={navigateImage}
          title={property.title}
          dict={dict}
        />
      )}

      {/* Contact Modal */}
      <Suspense fallback={null}>
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyId={property.id}
          officeId={property.office_id}
          officeName={property.offices?.name || ""}
          officePhone={property.offices?.phone}
          officeEmail={property.offices?.email}
          dict={dict as unknown as { contact: Record<string, string>; common: Record<string, string> }}
        />
      </Suspense>
    </main>
  );
}

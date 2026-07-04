"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { useParams } from "next/navigation";
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
  ChevronRight,
  Building2,
  X,
  ParkingCircle,
  Accessibility,
  DoorOpen,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/cn";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Navbar from "@/components/layout/Navbar";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useFocusTrap, useEscapeKey } from "@/lib/utils/a11y";
import FavoriteButton from "@/components/properties/FavoriteButton";
import CompareButton from "@/components/properties/CompareButton";
import type { PropertyForComparison } from "@/hooks/useCompare";
import type { Database } from "@/lib/supabase/types";
import { sanitizeJsonLd } from "@/lib/security/sanitizeHtml";
import { logger } from "@/lib/logger";

const ContactModal = lazy(() => import("@/components/properties/ContactModal"));

type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_types: { name_ar: string; name_en: string | null } | null;
  zones: { name_ar: string; name_en: string | null } | null;
  offices: { name: string; phone: string; email: string } | null;
};

type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];

export default function PropertyDetailPage() {
   const params = useParams();
   const locale = params.locale as Locale;
   const id = params.id as string;
   const dict = getMessages(locale);
   const { user } = useAuthUser();
   const userId = user?.id || null;

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const { containerRef: lightboxRef, handleKeyDown: handleLightboxKeyDown } = useFocusTrap(showLightbox);
  const triggerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const loadProperty = useCallback(async () => {
    try {
      const supabase = createClient();
      const [propertyResult, imagesResult] = await Promise.all([
        supabase
          .from("properties")
          .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, is_active, office_id, created_at, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name, phone, email)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("property_images")
          .select("id, property_id, url, file_path, sort_order, is_primary")
          .eq("property_id", id)
          .order("sort_order"),
      ]);

      if (!mountedRef.current) return;
      if (propertyResult.data) setProperty(propertyResult.data);
      if (imagesResult.data) setImages(imagesResult.data);
    } catch (err) {
      logger.error("Failed to load property", { error: err instanceof Error ? err.message : String(err), id });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    loadProperty();
    return () => { mountedRef.current = false; };
  }, [id, loadProperty]);

  const handleContact = () => {
    setShowContactModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `${property?.title} - ${formatPrice(property?.price || 0)}`,
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

  useEscapeKey(() => setShowLightbox(false), showLightbox);

  useEffect(() => {
    if (!showLightbox) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateImage("next");
      if (e.key === "ArrowLeft") navigateImage("prev");
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [showLightbox, navigateImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{dict.property.notFound}</h2>
          <p className="text-gray-500 mb-4">{dict.property.notFoundDesc}</p>
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            {dict.property.backToExplore}
          </Link>
        </div>
      </div>
    );
  }

  // JSON-LD structured data for SEO
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
    <div className="min-h-screen bg-gray-50">
      <a href="#property-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:ring-2 focus:ring-blue-500">
        {dict.common.skipToContent}
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizedJsonLd }}
      />
      <Navbar locale={locale} dict={dict} />
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label={dict.common.breadcrumb}>
<Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">
               {dict.common.home}
             </Link>
             <ChevronLeft className="w-4 h-4" />
             <Link href={`/${locale}/explore`} className="hover:text-gray-900 transition-colors">
               {dict.nav.explore}
             </Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" id="property-content" tabIndex={-1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {images.length > 0 ? (
                <>
                  <div
                    className="relative aspect-video cursor-pointer group"
                    onClick={() => setShowLightbox(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowLightbox(true);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    ref={triggerRef}
                    aria-label={dict.explore.openGallery}
                  >
                    <Image
                      src={images[currentImageIndex].url}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={currentImageIndex === 0}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {currentImageIndex + 1}/{images.length}
                    </div>
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
                          className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                          aria-label={dict.common.previousImage}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
                          className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                          aria-label={dict.common.nextImage}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                              aria-label={dict.common.goToImage?.replace("{{number}}", String(i + 1))}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                i === currentImageIndex ? "bg-white" : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setCurrentImageIndex(i)}
                          aria-label={`${dict.property.imageAlt} ${i + 1}`}
                          aria-current={i === currentImageIndex ? "true" : undefined}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            i === currentImageIndex ? "border-blue-500" : "border-transparent"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={`${dict.property.imageAlt} ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{locale === "ar" ? property.zones?.name_ar : property.zones?.name_en}</span>
                  </div>
</div>
                <Badge variant={statusVariant}>
                  {dict.property.status[property.status as keyof typeof dict.property.status]}
                </Badge>
              </div>

              <p className="text-3xl font-bold text-blue-600 mb-6">
                {formatPrice(property.price)}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Maximize className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-900">{property.area} {dict.property.areaUnit}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-900">{property.bedrooms} {dict.property.bedroom}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-900">{property.bathrooms} {dict.property.bathroom}</p>
                </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{dict.property.features}</h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        <feat.icon className="w-4 h-4" />
                        {feat.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.property.description}</h3>
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

               {/* Extra details */}
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
                <Button
                  className="flex-1"
                  onClick={handleContact}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  {dict.property.whatsapp}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleContact}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  {dict.property.call}
                </Button>
              </div>
<Button
                 className="w-full"
                 variant="ghost"
                 onClick={handleShare}
               >
                 <Share2 className="w-4 h-4 ml-2" />
                 {dict.property.share}
               </Button>
<div className="mt-2 flex justify-center items-center gap-4">
                  <CompareButton
                    property={property as unknown as PropertyForComparison}
                    locale={locale}
          dict={dict}
                  />
                  <FavoriteButton propertyId={property.id} userId={userId} locale={locale} dict={dict} />
                </div>
             </div>

            {/* Office Info */}
            {property.offices && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">{dict.property.officeLabel}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.offices.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {property.offices.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{property.offices.phone}</span>
                    </div>
                  )}
                  {property.offices.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{property.offices.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && images.length > 0 && (
        <div
          ref={lightboxRef}
          onKeyDown={handleLightboxKeyDown}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={dict.common.imageLightbox}
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
            aria-label={dict.common.closeLightbox}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-6 right-6 text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          <Image
            src={images[currentImageIndex].url}
            alt={property.title}
            fill
            className="object-contain"
            sizes="90vw"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                aria-label={dict.common.previousImage}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                aria-label={dict.common.nextImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-4 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    i === currentImageIndex
                      ? "border-white scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`${i + 1} / ${images.length}`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
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
    </div>
  );
}

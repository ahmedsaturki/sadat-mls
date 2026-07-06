"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Home } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/properties/ShareButton";
import FavoriteButton from "@/components/properties/FavoriteButton";
import CompareButton from "@/components/properties/CompareButton";
import { formatPrice } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import type { PropertyStatus } from "@/lib/utils/constants";

interface LuxuryPropertyCardProps {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  zone?: string;
  imageUrl?: string;
  status: PropertyStatus;
  officeName: string;
  locale: Locale;
  type?: string;
  dict?: Messages;
  userId?: string | null;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
}

const LuxuryPropertyCard = memo(function LuxuryPropertyCard({
   id,
   title,
   price,
   area,
   bedrooms,
   bathrooms,
   zone,
   imageUrl,
   status,
   officeName,
   locale,
   type,
   dict,
   userId,
  }: LuxuryPropertyCardProps) {
  const getLabel = (key: string, fallback: string): string => {
    if (!dict) return fallback;
    const d = dict as Record<string, unknown>;
    const property = d.property as Record<string, unknown> | undefined;
    const explore = d.explore as Record<string, string> | undefined;
    const flatVal = property?.[key] || explore?.[key];
    if (flatVal) return flatVal as string;
    const nested = property?.status as Record<string, string> | undefined;
    return nested?.[key] || fallback;
  };

  const statusConfig = {
    available: { label: getLabel("available", "Available"), variant: "success" as const },
    reserved: { label: getLabel("reserved", "Reserved"), variant: "warning" as const },
    rented: { label: getLabel("rented", "Rented"), variant: "warning" as const },
    sold: { label: getLabel("sold", "Sold"), variant: "danger" as const },
    pending_review: { label: getLabel("pending_review", "Pending Review"), variant: "info" as const },
  };

  return (
    <div
      className="animate-fade-up group relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:shadow-[#C49A2A]/20 transition-all duration-300 border border-gray-100"
    >
      <Link href={`/${locale}/explore/${id}`} className="block w-full" aria-label={`${title} - ${statusConfig[status].label}`}>
        {/* Image Container with Zoom Effect */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAyACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ApsC/9k="
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#1B2D4F]/5 to-[#1B2D4F]/10">
              <Home className="w-12 h-12 text-[#1B2D4F]/20" aria-hidden="true" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          
          {/* Top Actions & Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
            <Badge variant={statusConfig[status].variant} aria-label={statusConfig[status].label} className="shadow-lg backdrop-blur-md bg-white/90">
              {statusConfig[status].label}
            </Badge>
            <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
              <CompareButton property={{ id, title, price, area, bedrooms: bedrooms || 0, bathrooms: bathrooms || 0, zone: zone ?? null, type: type ?? null, officeName: officeName ?? null, status: status ?? null, primaryImage: null, description: null }} locale={locale} dict={dict} size="sm" />
              <FavoriteButton propertyId={id} userId={userId} locale={locale} dict={dict} size="sm" />
            </div>
          </div>
          
          {/* Bottom Price & Location Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            <p className="text-2xl font-bold font-serif text-[#C49A2A] drop-shadow-md">
               {formatPrice(price, locale)} <span className="text-sm text-gray-200 font-sans">{dict?.property?.priceUnit || "EGP"}</span>
            </p>
            {zone && (
              <p className="text-sm text-gray-200 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C49A2A]" aria-hidden="true" /> {zone}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-lg text-[#1B2D4F] mb-1 line-clamp-1 group-hover:text-[#C49A2A] transition-colors">
            {title}
          </h3>

          {type && (
            <p className="text-xs text-gray-500 mb-3">{type}</p>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 mb-3">
            {bedrooms !== undefined && (
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50">
                <Bed className="w-4 h-4 text-[#C49A2A] mb-1" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">{bedrooms}</span>
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50">
                <Bath className="w-4 h-4 text-[#C49A2A] mb-1" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">{bathrooms}</span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50">
              <Maximize className="w-4 h-4 text-[#C49A2A] mb-1" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                 {area} <span className="text-[10px] text-gray-500">{(dict?.property?.areaUnit as string) || "m²"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs font-medium text-gray-500 truncate max-w-[150px]">{officeName}</span>
            <div onClick={(e) => e.preventDefault()}>
               <ShareButton title={title} dict={dict} />
            </div>
          </div>
        </div>
        
        {/* Decorative Bottom Bar */}
        <div className="h-1 w-full bg-gray-100 group-hover:bg-[#C49A2A] transition-colors duration-300" />
      </Link>
    </div>
  );
});

export default LuxuryPropertyCard;

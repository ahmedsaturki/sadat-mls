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

interface PropertyCardProps {
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

const PropertyCard = memo(function PropertyCard({
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
  }: PropertyCardProps) {
  const getLabel = (key: string, fallback: string): string => {
    if (!dict) return fallback;
    const d = dict as Record<string, unknown>;
    const property = d.property as Record<string, string> | undefined;
    const explore = d.explore as Record<string, string> | undefined;
    return property?.[key] || explore?.[key] || fallback;
  };

const statusConfig = {
     available: { label: getLabel("statusAvailable", locale === "ar" ? "متاح" : "Available"), variant: "success" as const },
     reserved: { label: getLabel("reserved", locale === "ar" ? "محجوز" : "Reserved"), variant: "warning" as const },
     rented: { label: getLabel("rented", locale === "ar" ? "مؤجر" : "Rented"), variant: "warning" as const },
     sold: { label: getLabel("sold", locale === "ar" ? "تم البيع" : "Sold"), variant: "danger" as const },
     pending_review: { label: getLabel("pending_review", locale === "ar" ? "قيد المراجعة" : "Pending Review"), variant: "info" as const },
   };

   return (
     <Link href={`/${locale}/explore/${id}`} className="group" aria-label={`${title} - ${statusConfig[status].label}`}>
       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
         {/* Image */}
         <div className="relative h-48 bg-gray-100">
           {imageUrl ? (
             <Image
               src={imageUrl}
               alt={title}
               fill
               sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
               placeholder="blur"
               blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAyACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ApsC/9k="
               className="object-cover group-hover:scale-105 transition-transform duration-300"
             />
           ) : (
             <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
               <Home className="w-12 h-12 text-blue-300" />
             </div>
           )}
<div className="absolute top-2 right-2 flex gap-1">
               <CompareButton property={{ id, title, price, area, bedrooms: bedrooms || 0, bathrooms: bathrooms || 0, zone, type, officeName, status }} locale={locale} dict={dict} size="sm" />
               <FavoriteButton propertyId={id} userId={userId} locale={locale} dict={dict} size="sm" />
               <Badge variant={statusConfig[status].variant} aria-label={statusConfig[status].label}>{statusConfig[status].label}</Badge>
             </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          {type && (
            <p className="text-xs text-gray-500 mb-2">{type}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {bedrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {bedrooms}
              </span>
            )}
            {bathrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {area} {(dict?.property?.areaUnit as string) || (locale === "ar" ? "م²" : "m²")}
            </span>
          </div>

          {zone && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <MapPin className="w-3 h-3" />
              {zone}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(price, locale)} {dict?.property?.priceUnit || (locale === "ar" ? "ج.م" : "EGP")}
            </span>
            <div className="flex items-center gap-1">
              <ShareButton title={title} dict={dict} />
              <span className="text-xs text-gray-500">{officeName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default PropertyCard;

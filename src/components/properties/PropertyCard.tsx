"use client";

import { memo } from "react";
import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Home } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/properties/ShareButton";
import CompareButton from "@/components/properties/CompareButton";
import { cn, formatPrice } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

export interface PropertyCardProps {
  id: string;
  title: string;
  price?: number | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  location?: string | null;
  /** Transitional presentation aliases kept for non-database callers during migration. */
  zone?: string | null;
  officeName?: string | null;
  userId?: string | null;
  imageUrl?: string | null;
  priority?: boolean;
  status: string;
  type?: string | null;
  locale: Locale;
  dict?: Messages;
  compact?: boolean;
}

function getStatusLabel(dict: Messages | undefined, status: string): string {
  if (!dict) return status;
  const property = dict.property as Record<string, unknown> | undefined;
  const statusMap = property?.status as Record<string, string> | undefined;
  return typeof statusMap?.[status] === "string" ? statusMap[status] : status;
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "active": return "success";
    case "sold": return "danger";
    case "rented": return "warning";
    case "inactive":
    case "archived": return "info";
    default: return "warning";
  }
}

const PropertyCard = memo(function PropertyCard({
  id,
  title,
  price,
  area,
  bedrooms,
  bathrooms,
  location,
  zone,
  imageUrl,
  status,
  locale,
  type,
  dict,
  compact,
  priority,
}: PropertyCardProps) {
  const statusLabel = getStatusLabel(dict, status);
  const displayLocation = location ?? zone ?? null;
  const priceUnit = (dict?.property as Record<string, unknown> | undefined)?.priceUnit as string | undefined;
  const areaUnit = (dict?.property as Record<string, unknown> | undefined)?.areaUnit as string | undefined;
  const compareProp = {
    id,
    title,
    price: price ?? null,
    area: area ?? null,
    bedrooms: bedrooms ?? 0,
    bathrooms: bathrooms ?? 0,
    zone: displayLocation,
    type: type ?? null,
    officeName: "",
    status,
    primaryImage: imageUrl ?? null,
    description: null,
  };

  return (
    <Link
      href={`/${locale}/explore/${id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      aria-label={`${title} - ${statusLabel}`}
    >
      <article className={cn(
        "bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
        compact && "text-sm"
      )}>
        <div className={cn("relative bg-gray-100 overflow-hidden", compact ? "h-36" : "h-44 sm:h-48")}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200" aria-hidden="true">
              <Home className={cn("text-gray-300", compact ? "w-10 h-10" : "w-12 h-12")} />
            </div>
          )}
          <div className="absolute top-2 end-2">
            <Badge variant={getStatusVariant(status)} aria-label={statusLabel}>{statusLabel}</Badge>
          </div>
          <div
            className="absolute bottom-2 end-2"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
          >
            <CompareButton property={compareProp} locale={locale} dict={dict} size="sm" />
          </div>
        </div>

        <div className={cn("flex flex-col flex-1", compact ? "p-3" : "p-4")}>
          <h3 className={cn(
            "font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-navy-600 transition-colors",
            compact ? "text-sm" : "text-base"
          )}>{title}</h3>
          {type && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{type}</p>}
          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-3 flex-wrap">
            {bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-4 h-4" aria-hidden="true" />{bedrooms}</span>}
            {bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4" aria-hidden="true" />{bathrooms}</span>}
            {area != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" aria-hidden="true" />{area} {areaUnit ?? ""}</span>}
          </div>
          {displayLocation && <div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><MapPin className="w-3 h-3 shrink-0" aria-hidden="true" /><span className="truncate">{displayLocation}</span></div>}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
            <span className={cn("font-bold text-navy-600", compact ? "text-sm" : "text-lg")}>
              {price != null ? formatPrice(price, locale) : "—"}{" "}
              {price != null && <span className="text-xs text-gray-500 font-normal">{priceUnit ?? ""}</span>}
            </span>
            <div onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}><ShareButton title={title} dict={dict} /></div>
          </div>
        </div>
      </article>
    </Link>
  );
});

export default PropertyCard;

"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Home } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/properties/ShareButton";
import FavoriteButton from "@/components/properties/FavoriteButton";
import CompareButton from "@/components/properties/CompareButton";
import { cn, formatPrice } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import type { PropertyStatus } from "@/lib/utils/constants";

export interface PropertyCardProps {
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
  compact?: boolean;
}

function arePropsEqual(
  prev: PropertyCardProps,
  next: PropertyCardProps
): boolean {
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.price === next.price &&
    prev.area === next.area &&
    prev.bedrooms === next.bedrooms &&
    prev.bathrooms === next.bathrooms &&
    prev.zone === next.zone &&
    prev.imageUrl === next.imageUrl &&
    prev.status === next.status &&
    prev.officeName === next.officeName &&
    prev.locale === next.locale &&
    prev.type === next.type &&
    prev.dict === next.dict &&
    prev.userId === next.userId &&
    prev.compact === next.compact
  );
}

const PROPERTY_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAyACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ApsC/9k=";

function getStatusLabel(dict: Messages | undefined, key: string): string {
  if (!dict) return key;
  const property = dict.property as Record<string, unknown> | undefined;
  const status = property?.status as Record<string, string> | undefined;
  if (status && typeof status[key] === "string") return status[key] as string;
  if (property && typeof property[key] === "string") return property[key] as string;
  return key;
}

function getStatusVariant(
  status: PropertyStatus
): "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "available":
      return "success";
    case "sold":
      return "danger";
    case "pending_review":
      return "info";
    case "rented":
    case "reserved":
    default:
      return "warning";
  }
}

const PropertyCard = memo(function PropertyCard(props: PropertyCardProps) {
  const {
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
    compact,
  } = props;

  const statusLabel = getStatusLabel(dict, status);
  const variant = getStatusVariant(status);
  const ariaLabel = `${title} - ${statusLabel}`;

  const priceUnit = (dict?.property as Record<string, unknown> | undefined)
    ?.priceUnit as string | undefined;
  const areaUnit = (dict?.property as Record<string, unknown> | undefined)
    ?.areaUnit as string | undefined;

  const compareProp = {
    id,
    title,
    price,
    area,
    bedrooms: bedrooms ?? 0,
    bathrooms: bathrooms ?? 0,
    zone: zone ?? null,
    type: type ?? null,
    officeName,
    status,
    primaryImage: null,
    description: null,
  };

  return (
    <Link
      href={`/${locale}/explore/${id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
      aria-label={ariaLabel}
    >
      <article
        className={cn(
          "bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
          compact && "text-sm"
        )}
      >
        <div
          className={cn(
            "relative bg-gray-100 overflow-hidden",
            compact ? "h-36" : "h-44 sm:h-48"
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={PROPERTY_BLUR}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200"
              aria-hidden="true"
            >
              <Home className={cn("text-gray-300", compact ? "w-10 h-10" : "w-12 h-12")} />
            </div>
          )}

          {imageUrl && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          )}

          <div className="absolute top-2 end-2 flex gap-1 items-center">
            <Badge variant={variant} aria-label={statusLabel}>
              {statusLabel}
            </Badge>
          </div>

          <div
            className="absolute bottom-2 end-2 flex gap-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <CompareButton
              property={compareProp}
              locale={locale}
              dict={dict}
              size="sm"
            />
            <FavoriteButton
              propertyId={id}
              userId={userId ?? null}
              locale={locale}
              dict={dict}
              size="sm"
            />
          </div>
        </div>

        <div className={cn("flex flex-col flex-1", compact ? "p-3" : "p-4")}>
          <h3
            className={cn(
              "font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors",
              compact ? "text-sm" : "text-base"
            )}
          >
            {title}
          </h3>

          {type && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{type}</p>}

          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-3 flex-wrap">
            {bedrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" aria-hidden="true" />
                {bedrooms}
              </span>
            )}
            {bathrooms !== undefined && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" aria-hidden="true" />
                {bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" aria-hidden="true" />
              {area} {areaUnit ?? ""}
            </span>
          </div>

          {zone && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{zone}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
            <span className={cn("font-bold text-blue-600", compact ? "text-sm" : "text-lg")}>
              {formatPrice(price, locale)}{" "}
              <span className="text-xs text-gray-500 font-normal">{priceUnit ?? ""}</span>
            </span>
            <div className="flex items-center gap-1">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ShareButton title={title} dict={dict} />
              </div>
              <span
                className="text-xs text-gray-500 truncate max-w-[120px]"
                title={officeName}
              >
                {officeName}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}, arePropsEqual);

export default PropertyCard;

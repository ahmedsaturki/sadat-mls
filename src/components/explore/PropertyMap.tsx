"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Map } from "lucide-react";
import type { PropertyStatus } from "@/lib/utils/constants";
import type { Locale } from "@/i18n/config";

interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  latitude: number | null;
  longitude: number | null;
  primaryImage?: string | null;
}

interface PropertyMapProps {
  properties: Property[];
  locale: Locale;
}

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  reserved: "#f59e0b",
  sold: "#ef4444",
  rented: "#8b5cf6",
  pending_review: "#6b7280",
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  available: { ar: "متاح", en: "Available" },
  reserved: { ar: "محجوز", en: "Reserved" },
  sold: { ar: "تم البيع", en: "Sold" },
  rented: { ar: "تم الإيجار", en: "Rented" },
  pending_review: { ar: "قيد المراجعة", en: "Pending Review" },
};

export default function PropertyMap({ properties, locale }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  const validProperties = properties.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (validProperties.length === 0) return;

    let cancelled = false;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons in bundled apps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [30.3642, 31.0130], // Sadat City
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      const newMarkers: unknown[] = [];
      validProperties.forEach((property) => {
        if (cancelled) return;
        const color = STATUS_COLORS[property.status] || "#6b7280";
        const statusLabel = STATUS_LABELS[property.status]?.[locale] || property.status;

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">${property.bedrooms || "?"}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([property.latitude!, property.longitude!], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:200px;font-family:sans-serif;">
              ${property.primaryImage ? `<img src="${property.primaryImage}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ""}
              <h3 style="font-weight:600;font-size:14px;margin:0 0 4px;color:#1f2937;">${property.title}</h3>
              <p style="color:#1B2D4F;font-weight:700;font-size:16px;margin:0 0 4px;">${formatPrice(property.price)}</p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">${property.area} m² · ${property.bedrooms} ${locale === "ar" ? "غرف" : "bed"} · ${property.bathrooms} ${locale === "ar" ? "حمام" : "bath"}</p>
              <span style="display:inline-block;background:${color}20;color:${color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-bottom:8px;">${statusLabel}</span>
              <br><a href="/${locale}/explore/${property.id}" style="color:#1B2D4F;font-weight:600;font-size:13px;text-decoration:none;">${locale === "ar" ? "عرض التفاصيل" : "View Details"} →</a>
            </div>
          `);

        newMarkers.push(marker);
      });

      markersRef.current = newMarkers;

      // Fit bounds if multiple properties
      if (validProperties.length > 1) {
        const bounds = L.latLngBounds(
          validProperties.map((p) => [p.latitude!, p.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validProperties, locale, formatPrice]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current as ReturnType<typeof L.map>;

      // Clear existing markers
      markersRef.current.forEach((m) => {
        (m as { remove: () => void }).remove();
      });
      markersRef.current = [];

      // Add new markers
      validProperties.forEach((property) => {
        const color = STATUS_COLORS[property.status] || "#6b7280";
        const statusLabel = STATUS_LABELS[property.status]?.[locale] || property.status;

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">${property.bedrooms || "?"}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([property.latitude!, property.longitude!], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:200px;font-family:sans-serif;">
              ${property.primaryImage ? `<img src="${property.primaryImage}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ""}
              <h3 style="font-weight:600;font-size:14px;margin:0 0 4px;color:#1f2937;">${property.title}</h3>
              <p style="color:#1B2D4F;font-weight:700;font-size:16px;margin:0 0 4px;">${formatPrice(property.price)}</p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">${property.area} m² · ${property.bedrooms} ${locale === "ar" ? "غرف" : "bed"} · ${property.bathrooms} ${locale === "ar" ? "حمام" : "bath"}</p>
              <span style="display:inline-block;background:${color}20;color:${color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-bottom:8px;">${statusLabel}</span>
              <br><a href="/${locale}/explore/${property.id}" style="color:#1B2D4F;font-weight:600;font-size:13px;text-decoration:none;">${locale === "ar" ? "عرض التفاصيل" : "View Details"} →</a>
            </div>
          `);

        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  }, [validProperties, locale, formatPrice]);

  if (validProperties.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{locale === "ar" ? "لا توجد عقارات مع مواقع على الخريطة" : "No properties with map locations"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-xl border border-gray-200 z-0"
        style={{ minHeight: "500px" }}
      />
      <div className="absolute bottom-4 start-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 z-[1000]">
        {validProperties.length} {locale === "ar" ? "عقارات على الخريطة" : "properties on map"}
      </div>
    </div>
  );
}

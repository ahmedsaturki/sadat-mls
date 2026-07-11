"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface Project {
  id: string;
  title: string;
  slug: string;
  status: string;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  delivery_date: string | null;
  cover_image_url: string | null;
  developer_id: string;
  developers?: { name: string } | null;
}

export default function ProjectsClient({
  projects,
  locale,
  dict,
}: {
  projects: Project[];
  locale: Locale;
  dict: Messages;
}) {
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      upcoming: dict.admin.statusUpcoming,
      under_construction: dict.admin.statusUnderConstruction,
      delivered: dict.admin.statusDelivered,
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-700",
      under_construction: "bg-yellow-100 text-yellow-700",
      delivered: "bg-green-100 text-green-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price);
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{dict.common.noData}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((proj) => (
        <Link
          key={proj.id}
          href={`/${locale}/projects/${proj.slug}`}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
        >
          {proj.cover_image_url ? (
            <img src={proj.cover_image_url} alt={proj.title} className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-navy-50 flex items-center justify-center">
              <Briefcase className="w-12 h-12 text-navy-200" />
            </div>
          )}
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 text-lg">{proj.title}</h3>
            {proj.developers && (
              <p className="text-sm text-gray-500 mt-1">{proj.developers.name}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(proj.status)}`}>
                {statusLabel(proj.status)}
              </span>
            </div>
            {(proj.min_price || proj.max_price) && (
              <p className="text-navy-600 font-semibold mt-3">
                {formatPrice(proj.min_price)} - {formatPrice(proj.max_price)} EGP
              </p>
            )}
            {(proj.min_area || proj.max_area) && (
              <p className="text-sm text-gray-500 mt-1">
                {proj.min_area} - {proj.max_area} m²
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

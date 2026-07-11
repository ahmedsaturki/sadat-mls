"use client";

import Link from "next/link";
import { Building2, Globe } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface Developer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export default function DevelopersClient({
  developers,
  locale,
  dict,
}: {
  developers: Developer[];
  locale: Locale;
  dict: Messages;
}) {
  if (developers.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{dict.common.noData}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {developers.map((dev) => (
        <Link
          key={dev.id}
          href={`/${locale}/developers/${dev.slug}`}
          className="block bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md hover:border-navy-200 dark:hover:border-navy-700 transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            {dev.logo_url ? (
              <img src={dev.logo_url} alt={dev.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 bg-navy-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-navy-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{dev.name}</h3>
              <p className="text-sm text-gray-500">{dev.slug}</p>
            </div>
          </div>
          {dev.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{dev.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

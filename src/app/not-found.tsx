"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Search } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const dict = getMessages(locale);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-24 h-24 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-12 h-12 text-navy-600" />
        </div>
        <h1 className="text-6xl font-bold text-navy-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{dict.common.notFound}</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {dict.common.notFoundDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
<Link
             href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2 bg-navy-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors"
           >
             <Home className="w-5 h-5" />
             {dict.common.home}
           </Link>
           <Link
             href={`/${locale}/explore`}
             className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
           >
             <Search className="w-5 h-5" />
             {dict.nav.explore}
           </Link>
         </div>
         <div className="mt-8 pt-6 border-t border-gray-200">
           <p className="text-sm text-gray-400">
             {dict.common.hint}
           </p>
         </div>
      </div>
    </div>
  );
}

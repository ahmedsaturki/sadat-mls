import Link from "next/link";
import { Building2, MapPin, Mail, Phone } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface FooterProps {
  locale: Locale;
  dict: Messages;
}

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();
  const footer = dict.footer;

  return (
    <footer
      className="py-12 bg-gray-900 text-gray-500"
      role="contentinfo"
      aria-label={dict.footer?.title}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-navy-500" aria-hidden="true" />
              <span className="text-lg font-semibold text-white">
                {dict.common.appName}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{footer.description}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">
              {footer.quickLinks}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {dict.common.home}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/explore`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {dict.nav.explore}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {dict.nav.contact}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/login`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {dict.common.login}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{footer.contactUs}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-500 shrink-0" aria-hidden="true" />
                <span>{footer.location}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-navy-500 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${footer.email}`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
                >
                  {footer.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-navy-500 shrink-0" aria-hidden="true" />
                <span>{footer.callUs}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          &copy; {year} {footer.sadatMLS}. {footer.rights}.
          {footer.poweredBy && (
            <span className="ms-2 text-gray-500">
              &middot; {footer.poweredBy} Next.js
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

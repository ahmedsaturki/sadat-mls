import { Cairo } from "next/font/google";
import Providers from "@/components/Providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

/**
 * Locale layout — thin wrapper only.
 *
 * The root layout is the sole owner of <html>, <body>, metadata,
 * viewport, scripts, and <link rel="alternate"> tags.
 * This layout exists only to provide the Cairo font variable and
 * the Providers wrapper for locale-specific child routes.
 */
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cairo.variable}>
      <Providers>{children}</Providers>
    </div>
  );
}

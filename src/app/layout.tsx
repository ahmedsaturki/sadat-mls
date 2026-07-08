import { Cairo } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

/**
 * Root layout — thin wrapper only.
 *
 * The [locale] layout is the sole owner of <html>, <body>, metadata,
 * scripts, and <link rel="alternate"> tags.  This layout exists only to
 * provide the Cairo font variable and the Providers wrapper.
 */
export default function RootLayout({
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

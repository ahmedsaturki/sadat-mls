import Providers from "@/components/Providers";

/**
 * Locale layout — thin wrapper only.
 *
 * The root layout owns <html>, <body>, metadata, viewport, scripts,
 * the Cairo font variable, and <link rel="alternate"> tags.
 * This layout exists only to provide the Providers wrapper for
 * locale-specific child routes.
 */
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>{children}</Providers>
  );
}

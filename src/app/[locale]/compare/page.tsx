import Link from "next/link";
import Image from "next/image";
import { isValidLocale } from "@/i18n/config";
import { getMessages, type Messages } from "@/i18n/getMessages";
import { getPropertyByIds } from "@/lib/queries/propertyQueries";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils/cn";

interface ComparePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ar";

  if (!isValidLocale(locale)) {
    return null;
  }

  const dict: Messages = getMessages(locale);
  const resolvedSearch = await searchParams;
  const idsParam = resolvedSearch.ids;
  const propertyIds = idsParam ? idsParam.split(",").filter(Boolean) : [];

  let properties: Awaited<ReturnType<typeof getPropertyByIds>> = [];
  let loadError: string | null = null;

  if (propertyIds.length >= 2) {
    try {
      properties = await getPropertyByIds(propertyIds);
    } catch (err) {
      logger.error("Failed to load comparison properties", {
        error: err instanceof Error ? err.message : "Unknown",
      });
      loadError = dict.common.unexpectedError;
    }
  }

  const enoughSelected = propertyIds.length >= 2;
  const hasProperties = properties.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/${locale}/explore`}
            className="text-navy-600 hover:text-navy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
          >
            {dict.common.backToExplore}
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {dict.compare?.title}
          </h1>
        </div>

        {loadError && (
          <div className="p-4 text-red-700 bg-red-50 rounded-lg mb-4" role="alert">
            {loadError}
          </div>
        )}

        {hasProperties ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className={cn(
                    "border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  )}
                  aria-label={property.title}
                >
                  <Link
                    href={`/${locale}/explore/${property.id}`}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
                    aria-label={property.title}
                  >
                    <div className="relative w-full h-48 bg-gray-50">
                      <Image
                        src={property.primaryImage || "/placeholder-property.jpg"}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                    <div className="p-4 flex flex-col">
                      <p className="text-lg font-semibold">{property.title}</p>
                      {property.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {property.description}
                        </p>
                      )}
                      <div className="mt-4 pt-2 border-t border-gray-200">
                        <p className="text-gray-600 text-sm">
                          {dict.property?.price}:{" "}
                          {property.price != null
                            ? property.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")
                            : "—"}{" "}
                          {dict.property?.priceUnit || ""}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {dict.property?.area}:{" "}
                          {property.area != null ? property.area : "—"}{" "}
                          {dict.property?.areaUnit || ""}
                        </p>
                        {property.bedrooms != null && (
                          <p className="text-gray-600 text-sm">
                            {dict.property?.bedrooms}: {property.bedrooms}
                          </p>
                        )}
                        {property.bathrooms != null && (
                          <p className="text-gray-600 text-sm">
                            {dict.property?.bathrooms}: {property.bathrooms}
                          </p>
                        )}
                        {property.zone && (
                          <p className="text-gray-600 text-sm">
                            {dict.property?.zone}: {property.zone}
                          </p>
                        )}
                        {property.type && (
                          <p className="text-gray-600 text-sm">
                            {dict.property?.type}: {property.type}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-lg text-gray-600">
                {dict.compare?.selectedProperties?.replace("{{count}}", String(properties.length)) ||
                  `${properties.length} properties selected`}
              </p>
              <p className="text-sm text-gray-500">
                {dict.compare?.recommendedAction}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600">
              {!enoughSelected
                ? dict.compare?.needMoreProperties
                : dict.compare?.noPropertiesForComparison}
            </p>
            <div className="mt-4">
              <Link
                href={`/${locale}/explore`}
                className="inline-block text-navy-600 hover:text-navy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
              >
                {dict.common.backToExplore}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

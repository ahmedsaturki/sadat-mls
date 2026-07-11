"use client";

import { useState, lazy, Suspense } from "react";
import { FileDown } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";

const PDFDownloadLink = lazy(() =>
  import("@react-pdf/renderer").then((mod) => ({ default: mod.PDFDownloadLink }))
);

const PropertyReportPDF = lazy(() => import("./PropertyReportPDF"));

interface PropertyReportButtonProps {
  property: {
    title: string;
    description?: string;
    price: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    status: string;
    zone?: string;
    type?: string;
    office?: string;
  };
  locale: Locale;
  dict: { common: Record<string, string> };
}

export default function PropertyReportButton({ property, locale, dict }: PropertyReportButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  const fileName = `${property.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_")}_report.pdf`;

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setShowPreview(!showPreview)}
        className="gap-2"
      >
        <FileDown className="w-4 h-4" />
        {locale === "ar" ? "تقرير PDF" : "PDF Report"}
      </Button>

      {showPreview && (
        <div className="mt-3 flex items-center gap-3">
          <Suspense fallback={<span className="text-sm text-gray-500">Loading PDF...</span>}>
            <PDFDownloadLink
              document={<PropertyReportPDF property={property} locale={locale} />}
              fileName={fileName}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#1B2D4F",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {locale === "ar" ? "تحميل التقرير" : "Download Report"}
            </PDFDownloadLink>
          </Suspense>
        </div>
      )}
    </div>
  );
}

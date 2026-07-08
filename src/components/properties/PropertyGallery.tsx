"use client";

import { useCallback } from "react";
import Image from "next/image";
import { Building2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];

interface PropertyGalleryProps {
  images: PropertyImage[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onOpenLightbox: () => void;
  propertyTitle: string;
  dict: {
    property: {
      imageAlt: string;
    };
    explore: {
      openGallery: string;
    };
    common: {
      previousImage: string;
      nextImage: string;
    };
  };
}

export default function PropertyGallery({
  images,
  currentIndex,
  onIndexChange,
  onOpenLightbox,
  propertyTitle,
  dict,
}: PropertyGalleryProps) {
  const navigateImage = useCallback((dir: "prev" | "next") => {
    if (images.length <= 1) return;
    onIndexChange(
      dir === "prev"
        ? currentIndex === 0 ? images.length - 1 : currentIndex - 1
        : currentIndex === images.length - 1 ? 0 : currentIndex + 1
    );
  }, [images.length, currentIndex, onIndexChange]);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <Building2 className="w-16 h-16 text-gray-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div
        className="relative aspect-video cursor-pointer group"
        onClick={onOpenLightbox}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenLightbox();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={dict.explore.openGallery}
      >
        <Image
          src={images[currentIndex].url}
          alt={propertyTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={currentIndex === 0}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-4 end-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <ImageIcon className="w-3 h-3" aria-hidden="true" />
          {currentIndex + 1}/{images.length}
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
              className="absolute top-1/2 end-4 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              aria-label={dict.common.previousImage}
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
              className="absolute top-1/2 start-4 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              aria-label={dict.common.nextImage}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
                  aria-label={`Image ${i + 1} of ${images.length}`}
                  className={`w-2 h-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                    i === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => onIndexChange(i)}
              aria-label={`${dict.property.imageAlt} ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
              className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                i === currentIndex ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={`${dict.property.imageAlt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

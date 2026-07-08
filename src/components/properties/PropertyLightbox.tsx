"use client";

import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFocusTrap, useEscapeKey } from "@/lib/utils/a11y";
import type { Database } from "@/lib/supabase/types";

type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];

interface LightboxProps {
  images: PropertyImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
  title: string;
  dict: {
    common: {
      imageLightbox: string;
      closeLightbox: string;
      previousImage: string;
      nextImage: string;
      imageThumbnails: string;
    };
  };
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  title,
  dict,
}: LightboxProps) {
  const { containerRef, handleKeyDown } = useFocusTrap(true);

  useEscapeKey(onClose, true);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={dict.common.imageLightbox}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 start-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        aria-label={dict.common.closeLightbox}
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="absolute top-6 end-6 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      <Image
        src={images[currentIndex].url}
        alt={title}
        fill
        className="object-contain"
        sizes="90vw"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }}
            className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            aria-label={dict.common.previousImage}
          >
            <ChevronRight className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate("next"); }}
            className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            aria-label={dict.common.nextImage}
          >
            <ChevronLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-4 pb-2"
          role="group"
          aria-label={dict.common?.imageThumbnails || "Image thumbnails"}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {/* handled by parent */}}
              className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === currentIndex
                  ? "border-white scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`${i + 1} / ${images.length}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

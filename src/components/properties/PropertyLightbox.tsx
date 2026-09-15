"use client";

import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFocusTrap, useEscapeKey } from "@/lib/utils/a11y";

type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  file_path?: string | null;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
};

interface LightboxProps {
  images: PropertyImage[];
  currentIndex: number;
  isOpen?: boolean;
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
  propertyTitle?: string;
  title?: string;
  dict?: { common: { imageLightbox?: string; closeLightbox?: string; previousImage?: string; nextImage?: string; imageThumbnails?: string } };
}

export default function Lightbox({ images, currentIndex, isOpen = true, onClose, onNavigate, propertyTitle, title, dict }: LightboxProps) {
  const { containerRef, handleKeyDown } = useFocusTrap(isOpen);
  useEscapeKey(onClose, isOpen);

  if (!isOpen || images.length === 0) return null;
  const resolvedTitle = propertyTitle ?? title ?? "Property";
  const common = dict?.common;

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={common?.imageLightbox ?? "Image lightbox"} onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 start-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" aria-label={common?.closeLightbox ?? "Close"}><X className="w-5 h-5" aria-hidden="true" /></button>
      <div className="absolute top-6 end-6 text-white text-sm">{currentIndex + 1} / {images.length}</div>
      <Image src={images[currentIndex].url} alt={resolvedTitle} fill className="object-contain" sizes="90vw" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }} className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" aria-label={common?.previousImage ?? "Previous image"}><ChevronRight className="w-6 h-6 rtl:rotate-180" aria-hidden="true" /></button>
          <button onClick={(e) => { e.stopPropagation(); onNavigate("next"); }} className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" aria-label={common?.nextImage ?? "Next image"}><ChevronLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" /></button>
        </>
      )}
    </div>
  );
}

"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Trash2, Star, Upload, Image as ImageIcon } from "lucide-react";
import type { Messages } from "@/i18n/getMessages";

interface PropertyImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
}

interface PropertyImageManagerProps {
  dict: Messages;
  existingImages: PropertyImage[];
  newImages: {
    file: File;
    preview: string;
    alt_text: string;
  }[];
  onUpload: (files: FileList) => void;
  onRemoveExisting: (id: string) => void;
  onRemoveNew: (index: number) => void;
  onSetAltText: (index: number, value: string) => void;
  onSetPrimary: (id: string) => void;
}

export default function PropertyImageManager({
  dict,
  existingImages,
  newImages,
  onUpload,
  onRemoveExisting,
  onRemoveNew,
  onSetAltText,
  onSetPrimary,
}: PropertyImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isUploadAreaFocused, setIsUploadAreaFocused] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    onUpload(files);
  }, [onUpload]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, isNew: boolean) => {
    if (e.key === "Escape") {
      setFocusedIndex(null);
      return;
    }
    
    // ArrowLeft = next in RTL, ArrowRight = next in LTR
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const total = isNew ? newImages.length : existingImages.length;
      setFocusedIndex((index + 1) % total);
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const total = isNew ? newImages.length : existingImages.length;
      setFocusedIndex((index - 1 + total) % total);
    }
  }, [existingImages.length, newImages.length]);

  return (
    <div className="space-y-4" role="region" aria-label={dict.office.propertyImages}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          aria-label={dict.common.add}
        >
          <Upload className="w-4 h-4 me-1" aria-hidden="true" />
          {dict.common.add}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="sr-only"
          aria-label={dict.common.addImage}
        />
        <span className="text-xs text-gray-500" id="max-images-hint">
          {dict.office.maxImages}
        </span>
      </div>

      {existingImages.length > 0 && (
        <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden" aria-labelledby="existing-images-legend">
          <legend id="existing-images-legend" className="sr-only">
            {dict.office.currentImages}
          </legend>
          {existingImages.map((img, index) => (
            <div
              key={img.id}
              className={`relative group min-h-[200px] rounded-lg overflow-hidden border flex flex-col ${
                focusedIndex === index ? "ring-2 ring-navy-500 ring-offset-2" : ""
              }`}
              onKeyDown={(e) => handleKeyDown(e, index, false)}
              tabIndex={focusedIndex === index ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
            >
              <div className="relative flex-1">
                <Image
                  src={img.url}
                  alt={img.alt_text || `${dict.office.propertyImage} ${index + 1}`}
                  fill
                  className="object-cover group-hover:opacity-80 transition-opacity"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.id)}
                    className={`text-xs px-3 py-1.5 rounded-sm font-medium ${
                      img.is_primary
                        ? "bg-yellow-500 text-white"
                        : "bg-white/90 text-gray-800 hover:bg-white"
                    } flex items-center justify-center gap-1.5`}
                    aria-label={img.is_primary
                      ? dict.common.primaryImage
                      : dict.common.setAsPrimary}
                    aria-pressed={img.is_primary}
                  >
                    <Star className="w-4 h-4" aria-hidden="true" fill={img.is_primary ? "currentColor" : "none"} strokeWidth={img.is_primary ? 0 : 2} />
                    <span>{img.is_primary ? dict.common.primary : dict.common.setAsPrimary}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(img.id)}
                    className="text-xs px-3 py-1.5 rounded-sm font-medium bg-red-500 text-white flex items-center justify-center gap-1.5 hover:bg-red-600 transition-colors"
                    aria-label={`${dict.common.removeImage}: ${img.alt_text || "image"}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>{dict.common.remove}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </fieldset>
      )}

      {newImages.length > 0 && (
        <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden" aria-labelledby="new-images-legend">
          <legend id="new-images-legend" className="sr-only">
            {dict.office.newImages}
          </legend>
          {newImages.map((img, index) => (
            <div
              key={index}
              className={`relative group min-h-[200px] rounded-lg overflow-hidden border flex flex-col ${
                focusedIndex === index ? "ring-2 ring-navy-500 ring-offset-2" : ""
              }`}
              onKeyDown={(e) => handleKeyDown(e, index, true)}
              tabIndex={focusedIndex === index ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
            >
              <div className="relative flex-1">
                <Image
                  src={img.preview}
                  alt={img.alt_text || `${dict.office.newImage} ${index + 1}`}
                  fill
                  className="object-cover group-hover:opacity-80 transition-opacity"
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <label htmlFor={`alt-text-${index}`} className="sr-only">
                    {dict.common.editAltText}
                  </label>
                  <input
                    id={`alt-text-${index}`}
                    type="text"
                    value={img.alt_text}
                    onChange={(e) => onSetAltText(index, e.target.value)}
                    placeholder={dict.common.editAltText}
                    aria-label={dict.common.editAltText}
                    className="w-full text-xs px-2 py-1.5 rounded-sm bg-white/95 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveNew(index)}
                    className="text-xs px-3 py-1.5 rounded-sm font-medium bg-red-500 text-white flex items-center justify-center gap-1.5 hover:bg-red-600 transition-colors w-full"
                    aria-label={`${dict.common.removeImage}: ${img.alt_text || "image"}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>{dict.common.remove}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </fieldset>
      )}

      {existingImages.length === 0 && newImages.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isUploadAreaFocused ? "border-navy-500 bg-navy-50" : "border-gray-300 hover:border-navy-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onFocus={() => setIsUploadAreaFocused(true)}
          onBlur={() => setIsUploadAreaFocused(false)}
          role="button"
          tabIndex={0}
          aria-label={dict.common.add}
          aria-describedby="max-images-hint"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <ImageIcon className="w-12 h-12 text-gray-300" aria-hidden="true" />
            <span className="text-sm text-gray-500 font-medium">{dict.office.uploadImage}</span>
            <span className="text-xs text-gray-500">{dict.office.clickOrDrag}</span>
          </div>
        </div>
      )}
    </div>
  );
}
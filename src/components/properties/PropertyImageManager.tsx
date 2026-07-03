"use client";

import { useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
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
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          aria-label={dict.common.add}
        >
          {dict.common.add}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
        <span className="text-xs text-gray-500">
          {dict.office.maxImages}
        </span>
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden">
          {existingImages.map((img) => (
            <div key={img.id} className="relative group min-h-[200px] rounded-lg overflow-hidden border flex flex-col">
              <div className="relative flex-1">
                <Image
                  src={img.url}
                  alt={img.alt_text}
                  fill
                  className="object-cover group-hover:opacity-80 transition-opacity"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetPrimary(img.id)}
                  className={`text-xs px-2 py-1 rounded-sm ${img.is_primary ? "bg-yellow-500 text-white" : "bg-white/80 text-gray-800"}`}
                  aria-label={img.is_primary ? dict.common.primaryImage : dict.common.setAsPrimary}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.id)}
                  className="text-xs px-2 py-1 rounded-sm bg-red-500 text-white flex items-center justify-center gap-1"
                  aria-label={dict.common.removeImage}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {newImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden">
          {newImages.map((img, index) => (
            <div key={index} className="relative group min-h-[200px] rounded-lg overflow-hidden border flex flex-col">
              <div className="relative flex-1">
                <Image
                  src={img.preview}
                  alt={img.alt_text}
                  fill
                  className="object-cover group-hover:opacity-80 transition-opacity"
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <input
                  type="text"
                  value={img.alt_text}
                  onChange={(e) => onSetAltText(index, e.target.value)}
                  placeholder={dict.common.edit}
                  aria-label={dict.common.editAltText}
                  className="absolute bottom-2 left-2 right-2 text-xs px-2 py-1 rounded-sm bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => onRemoveNew(index)}
                  className="text-xs px-2 py-1 rounded-sm bg-red-500 text-white flex items-center justify-center gap-1"
                  aria-label={dict.common.removeImage}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {existingImages.length === 0 && newImages.length === 0 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { 
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          aria-label={dict.common.add}
        >
          <p className="text-sm text-gray-500">{dict.common.add}</p>
        </div>
      )}
    </div>
  );
}
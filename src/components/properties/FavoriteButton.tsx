"use client";

import { memo } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Messages } from "@/i18n/getMessages";

interface FavoriteButtonProps {
  propertyId: string;
  userId?: string | null;
  locale?: string;
  dict?: Messages;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const FavoriteButton = memo(function FavoriteButton({
  propertyId: _propertyId,
  userId: _userId,
  locale: _locale = "ar",
  dict,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const sizeClass = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const iconClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const label = dict?.common?.favorites || "Favorites";

  return (
    <button
      type="button"
      disabled
      aria-label={label}
      title={label}
      className={cn(sizeClass, "inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-300 cursor-not-allowed", className)}
    >
      <Heart className={iconClass} aria-hidden="true" />
    </button>
  );
});

FavoriteButton.displayName = "FavoriteButton";
export default FavoriteButton;

"use client";

import { memo, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/logger";

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
  propertyId,
  userId,
  locale = "ar",
  dict,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const toggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("property_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("property_id", propertyId);

        if (!error) setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from("property_favorites")
          .insert({ user_id: userId, property_id: propertyId });

        if (!error) setIsFavorited(true);
      }
    } catch (err) {
      logger.error("Failed to toggle favorite", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }, [propertyId, userId, isFavorited, locale]);

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        "flex items-center justify-center rounded-full transition-all active:scale-90",
        sizeClasses[size],
        isFavorited
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isFavorited ? (dict?.common?.removeFavorite || "Remove from favorites") : (dict?.common?.addFavorite || "Add to favorites")}
      aria-pressed={isFavorited}
    >
      <Heart
        className={cn(iconSizes[size], "transition-transform", isFavorited && "fill-current")}
      />
    </button>
  );
});

export default FavoriteButton;

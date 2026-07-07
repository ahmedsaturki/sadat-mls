"use client";

import { memo, useCallback } from "react";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCompare, type PropertyForComparison } from "@/hooks/useCompare";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import type { Messages } from "@/i18n/getMessages";

interface CompareButtonProps {
  property: PropertyForComparison;
  locale?: "ar" | "en";
  dict?: Messages;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const CompareButton = memo(function CompareButton({
   property,
   dict,
   className,
   size = "md",
  }: CompareButtonProps) {
   const { addProperty, removeProperty, isSelected, count, max } = useCompare();
   const { showToast } = useToast();

   const sizeClasses = {
     sm: "w-8 h-8",
     md: "w-10 h-10",
     lg: "w-12 h-12",
   };

  const getLabel = useCallback((key: string, fallback: string): string => {
    if (!dict) return fallback;
    const commonVal = dict.common as unknown as Record<string, string> | undefined;
    return commonVal?.[key] || fallback;
  }, [dict]);

   const handleToggle = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();

if (isSelected(property.id)) {
        removeProperty(property.id);
        showToast(getLabel("removeFromComparison", "Removed from comparison"), "success");
      } else {
        const added = addProperty(property);
        if (added) {
          showToast(getLabel("addToComparison", "Added to comparison"), "success");
       } else {
          logger.warn("Cannot add more properties to compare", { currentCount: count, max });
          const maxCompareMsg = getLabel("maxCompare", `Maximum ${max} properties`);
          showToast(maxCompareMsg.replace("{{max}}", String(max)), "warning");
       }
     }
    }, [isSelected, property, removeProperty, addProperty, showToast, getLabel, count, max]);

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-center rounded-full transition-all active:scale-90",
        sizeClasses[size],
        isSelected(property.id)
          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600",
        className
      )}
      aria-label={isSelected(property.id) ?
        getLabel("removeFromComparison", "Remove from comparison") :
        getLabel("addToComparison", "Add to comparison")}
      aria-pressed={isSelected(property.id)}
    >
      <GitCompare className={cn(size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5")} aria-hidden="true" />
    </button>
  );
});

export default CompareButton;
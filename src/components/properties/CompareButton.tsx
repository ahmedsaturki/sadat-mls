"use client";

import { memo, useCallback, useState, useEffect } from "react";
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
   const [optimisticSelected, setOptimisticSelected] = useState(() => isSelected(property.id));

   // Sync local state with hook when property or hook state changes
   useEffect(() => {
     setOptimisticSelected(isSelected(property.id));
   }, [isSelected, property.id]);

    const sizeClasses = {
      sm: "w-10 h-10",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

  const getLabel = useCallback((key: string): string => {
    if (!dict) return "";
    const commonVal = dict.common as unknown as Record<string, string> | undefined;
    return commonVal?.[key] || "";
  }, [dict]);

   const handleToggle = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();

     // Optimistic update: toggle immediately for instant UI feedback
     const newSelected = !optimisticSelected;
     setOptimisticSelected(newSelected);

     if (!newSelected) {
       // Removing from comparison
       removeProperty(property.id);
       showToast(getLabel("removeFromComparison"), "success");
     } else {
       // Adding to comparison
       const added = addProperty(property);
       if (added) {
         showToast(getLabel("addToComparison"), "success");
       } else {
         setOptimisticSelected(false); // Rollback on failure (e.g., max reached)
         logger.warn("Cannot add more properties to compare", { currentCount: count, max });
         const maxCompareMsg = getLabel("maxCompare");
         showToast(maxCompareMsg.replace("{{max}}", String(max)), "warning");
       }
     }
     }, [optimisticSelected, property, removeProperty, addProperty, showToast, getLabel, count, max]);

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-center rounded-full transition-all active:scale-90",
        sizeClasses[size],
        optimisticSelected
          ? "bg-navy-50 text-navy-600 hover:bg-navy-100"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600",
        className
      )}
      aria-label={optimisticSelected ?
        getLabel("removeFromComparison") :
        getLabel("addToComparison")}
      aria-pressed={optimisticSelected}
    >
      <GitCompare className={cn(size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5")} aria-hidden="true" />
    </button>
  );
});

export default CompareButton;